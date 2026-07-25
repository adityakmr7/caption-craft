import { NextResponse } from "next/server";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createClient as createSessionClient } from "@/app/lib/supabase/server";
import { getSupabaseServerClient } from "@/app/lib/supabase-server";
import { burnInCaptions } from "@/app/lib/captions/burn-in";
import { CAPTION_STYLE_IDS } from "@/app/lib/captions/styles";
import type { TimedWord } from "@/app/lib/captions/group-words";
import { uploadToR2, getR2PublicUrl } from "@/app/lib/r2";

// Same runtime/timeout reasoning as POST /api/videos.
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Re-renders an already-transcribed video with a different caption style.
 * Reuses the stored transcript - no re-transcription, no Groq call, no
 * credit charge. Only the (cheap, no-matting) FFmpeg render step repeats.
 * See docs/ARCHITECTURE.md Section 10.2 for why this stays cheap: none of
 * the current styles need matting, that's HyperFrames-only and shelved.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;

  const sessionClient = await createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const style = body?.style;

  if (typeof style !== "string" || !CAPTION_STYLE_IDS.includes(style)) {
    return NextResponse.json(
      { error: `Style must be one of: ${CAPTION_STYLE_IDS.join(", ")}` },
      { status: 400 }
    );
  }

  const db = getSupabaseServerClient();

  const { data: video, error: videoError } = await db
    .from("videos")
    .select("id, user_id, status, original_url")
    .eq("id", videoId)
    .single();

  if (videoError || !video || video.user_id !== user.id) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
  if (!video.original_url) {
    return NextResponse.json(
      { error: "This video's original file is no longer available." },
      { status: 409 }
    );
  }
  if (video.status !== "completed") {
    return NextResponse.json(
      { error: "This video isn't ready to restyle yet." },
      { status: 409 }
    );
  }

  const words = await loadStoredWords(db, videoId);
  if (words.length === 0) {
    return NextResponse.json(
      { error: "No transcript found for this video." },
      { status: 409 }
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "captioncraft-restyle-"));

  try {
    const originalRes = await fetch(video.original_url);
    if (!originalRes.ok) {
      throw new Error(`Could not fetch the original video (${originalRes.status})`);
    }
    const videoBuffer = Buffer.from(await originalRes.arrayBuffer());
    const sourcePath = path.join(workDir, "source.mp4");
    await writeFile(sourcePath, videoBuffer);

    const { outputPath } = await burnInCaptions(sourcePath, words, style);
    const outputBuffer = await readFile(outputPath);

    const processedKey = `videos/${videoId}/captioned.mp4`;
    await uploadToR2(processedKey, outputBuffer, "video/mp4");
    const processedUrl = `${getR2PublicUrl(processedKey)}?t=${Date.now()}`;

    await db
      .from("videos")
      .update({ style, processed_url: processedUrl })
      .eq("id", videoId);

    return NextResponse.json({ processedUrl });
  } catch (err) {
    console.error(`video ${videoId} restyle failed`, err);
    return NextResponse.json(
      { error: "Couldn't apply that style. Your previous version is still available." },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function loadStoredWords(
  db: ReturnType<typeof getSupabaseServerClient>,
  videoId: string
): Promise<TimedWord[]> {
  const { data: captions } = await db
    .from("captions")
    .select("id, start_time")
    .eq("video_id", videoId)
    .order("start_time", { ascending: true });

  if (!captions || captions.length === 0) return [];

  const words: TimedWord[] = [];
  for (const caption of captions) {
    const { data: captionWords } = await db
      .from("words")
      .select("text, start_time, end_time")
      .eq("caption_id", caption.id)
      .order("start_time", { ascending: true });

    for (const w of captionWords ?? []) {
      words.push({ text: w.text, start: w.start_time, end: w.end_time });
    }
  }

  return words;
}
