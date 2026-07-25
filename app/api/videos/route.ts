import { NextResponse } from "next/server";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient as createSessionClient } from "@/app/lib/supabase/server";
import { getSupabaseServerClient } from "@/app/lib/supabase-server";
import { transcribeAudio } from "@/app/lib/whisper";
import { burnInCaptions } from "@/app/lib/captions/burn-in";
import { CAPTION_STYLE_IDS } from "@/app/lib/captions/styles";
import { groupWords } from "@/app/lib/captions/group-words";
import { uploadToR2, getR2PublicUrl } from "@/app/lib/r2";

// Needs Node (child_process for ffmpeg, native canvas bindings) - not Edge.
export const runtime = "nodejs";
// Phase 3-4 runs processing synchronously in the request (no queue yet -
// Inngest is Phase 5). This works for short clips locally; on Vercel this
// will hit serverless execution limits for anything but very short videos -
// see docs/ARCHITECTURE.md Section 10.3 on why the real render step belongs
// on Cloud Run, not in a request/response cycle, once volume justifies it.
export const maxDuration = 300;

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB, matches the PRD limit

export async function POST(request: Request) {
  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let form: FormData | null = null;
  try {
    form = await request.formData();
  } catch (err) {
    console.error("Failed to parse upload form data", err);
  }
  const videoFile = form?.get("video");
  const audioFile = form?.get("audio");
  const style = form?.get("style");

  if (!(videoFile instanceof File) || !(audioFile instanceof File)) {
    return NextResponse.json(
      { error: "Missing video or audio file." },
      { status: 400 }
    );
  }
  if (typeof style !== "string" || !CAPTION_STYLE_IDS.includes(style)) {
    return NextResponse.json(
      { error: `Style must be one of: ${CAPTION_STYLE_IDS.join(", ")}` },
      { status: 400 }
    );
  }
  if (videoFile.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: "Video must be 100MB or smaller." },
      { status: 400 }
    );
  }

  const db = getSupabaseServerClient();

  const remainingCredits = await db.rpc("deduct_credit", {
    p_user_id: user.id,
    p_amount: 1,
  });
  if (remainingCredits.error || remainingCredits.data === null) {
    return NextResponse.json(
      { error: "Not enough credits. Upgrade your plan to keep processing videos." },
      { status: 402 }
    );
  }

  const { data: video, error: insertError } = await db
    .from("videos")
    .insert({ user_id: user.id, style, status: "processing" })
    .select("id")
    .single();

  if (insertError || !video) {
    await refundCredit(db, user.id, "video insert failed");
    return NextResponse.json(
      { error: "Something went wrong starting your video. Please try again." },
      { status: 500 }
    );
  }

  const videoId = video.id;

  await db.from("credit_transactions").insert({
    user_id: user.id,
    amount: -1,
    type: "video_processed",
    video_id: videoId,
    description: `style: ${style}`,
  });

  try {
    const result = await processVideo({
      videoId,
      style,
      videoFile,
      audioFile,
    });

    await db
      .from("videos")
      .update({
        status: "completed",
        original_url: result.originalUrl,
        processed_url: result.processedUrl,
        completed_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    return NextResponse.json({
      videoId,
      processedUrl: result.processedUrl,
    });
  } catch (err) {
    console.error(`video ${videoId} processing failed`, err);

    await db
      .from("videos")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", videoId);

    await refundCredit(db, user.id, "processing failed", videoId);

    return NextResponse.json(
      { error: "Processing failed. Your credit has been refunded." },
      { status: 500 }
    );
  }
}

async function refundCredit(
  db: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  reason: string,
  videoId?: string
) {
  const { data: profile } = await db
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!profile) return;

  await db
    .from("users")
    .update({ credits: profile.credits + 1 })
    .eq("id", userId);

  await db.from("credit_transactions").insert({
    user_id: userId,
    amount: 1,
    type: "refund",
    video_id: videoId ?? null,
    description: reason,
  });
}

async function processVideo({
  videoId,
  style,
  videoFile,
  audioFile,
}: {
  videoId: string;
  style: string;
  videoFile: File;
  audioFile: File;
}) {
  const db = getSupabaseServerClient();
  const workDir = await mkdtemp(path.join(tmpdir(), "captioncraft-upload-"));

  try {
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const originalKey = `videos/${videoId}/original.mp4`;
    await uploadToR2(originalKey, videoBuffer, "video/mp4");
    const originalUrl = getR2PublicUrl(originalKey);

    const words = await transcribeAudio(audioBuffer, audioFile.name || "audio.webm");

    const sourcePath = path.join(workDir, "source.mp4");
    await writeFile(sourcePath, videoBuffer);

    const { outputPath } = await burnInCaptions(sourcePath, words, style);
    const outputBuffer = await readFile(outputPath);

    const processedKey = `videos/${videoId}/captioned.mp4`;
    await uploadToR2(processedKey, outputBuffer, "video/mp4");
    const processedUrl = getR2PublicUrl(processedKey);

    await saveCaptions(db, videoId, words);

    return { originalUrl, processedUrl };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function saveCaptions(
  db: ReturnType<typeof getSupabaseServerClient>,
  videoId: string,
  words: { text: string; start: number; end: number }[]
) {
  const segments = groupWords(words);

  for (const segment of segments) {
    const { data: caption, error } = await db
      .from("captions")
      .insert({
        video_id: videoId,
        text: segment.text,
        start_time: segment.start,
        end_time: segment.end,
      })
      .select("id")
      .single();

    if (error || !caption) continue;

    await db.from("words").insert(
      segment.words.map((w) => ({
        caption_id: caption.id,
        text: w.text,
        start_time: w.start,
        end_time: w.end,
      }))
    );
  }
}
