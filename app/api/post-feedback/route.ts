import { NextResponse } from "next/server";
import { createClient, getUser } from "@/app/lib/supabase/server";

const OUTCOMES = ["flopped", "average", "viral"] as const;
type Outcome = (typeof OUTCOMES)[number];

const MAX_COMMENT_LENGTH = 1000;

// Lightweight post-performance feedback (2026-09-13 roadmap addition) —
// the Phase 3 data foundation: without this there's no signal on which
// templates/tones/voice-matched posts actually perform on LinkedIn. See
// supabase/migrations/0011_post_feedback.sql and app/app/post-feedback.tsx.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const generationId = body?.generationId;
  const outcome = body?.outcome;
  const comment = body?.comment;

  if (typeof generationId !== "string") {
    return NextResponse.json({ error: "Invalid generation." }, { status: 400 });
  }
  if (typeof outcome !== "string" || !OUTCOMES.includes(outcome as Outcome)) {
    return NextResponse.json({ error: "Invalid outcome." }, { status: 400 });
  }
  if (comment !== null && comment !== undefined && typeof comment !== "string") {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }
  if (typeof comment === "string" && comment.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be under ${MAX_COMMENT_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Confirm the generation belongs to this user before recording feedback
  // on it — RLS on generations already scopes this, a missing row here
  // means either it doesn't exist or isn't theirs.
  const { data: generation, error: fetchError } = await supabase
    .from("generations")
    .select("id")
    .eq("id", generationId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !generation) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const { error: upsertError } = await supabase.from("post_feedback").upsert(
    {
      generation_id: generationId,
      user_id: user.id,
      outcome,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "generation_id" }
  );

  if (upsertError) {
    console.error("post feedback upsert failed", upsertError);
    return NextResponse.json(
      { error: "Couldn't save your feedback. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
