import { NextResponse } from "next/server";
import { createClient, getUser } from "@/app/lib/supabase/server";
import { MIN_ONBOARDING_SAMPLES } from "@/app/lib/voice";

const MAX_SAMPLES_PER_REQUEST = 3;
const MIN_SAMPLE_LENGTH = 20; // filters out empty/junk pastes
const MAX_SAMPLE_LENGTH = 3000; // matches the voice_samples check constraint

// Saves the 2-3 past LinkedIn posts a user pastes during the voice-matching
// onboarding step (PRD §7.1a). Called once, before a new user's first
// generation — see app/app/voice-onboarding.tsx.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const samples = body?.samples;

  if (!Array.isArray(samples)) {
    return NextResponse.json({ error: "Invalid samples." }, { status: 400 });
  }

  const cleaned = samples
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_SAMPLE_LENGTH);

  if (cleaned.length < MIN_ONBOARDING_SAMPLES) {
    return NextResponse.json(
      {
        error: `Paste at least ${MIN_ONBOARDING_SAMPLES} posts (${MIN_SAMPLE_LENGTH}+ characters each).`,
      },
      { status: 400 }
    );
  }

  if (cleaned.some((s) => s.length > MAX_SAMPLE_LENGTH)) {
    return NextResponse.json(
      { error: `Each post must be under ${MAX_SAMPLE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const rows = cleaned
    .slice(0, MAX_SAMPLES_PER_REQUEST)
    .map((content) => ({ user_id: user.id, content }));

  const supabase = await createClient();
  const { error } = await supabase.from("voice_samples").insert(rows);

  if (error) {
    console.error("voice sample insert failed", error);
    return NextResponse.json(
      { error: "Couldn't save your posts. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
