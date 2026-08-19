import { NextResponse } from "next/server";

// Server-side proxy to Groq's Whisper transcription endpoint — keeps
// GROQ_API_KEY off the client. Mirrors the conventions in
// app/api/waitlist/route.ts (plain NextResponse.json, try/catch, lazy
// env-var check). See docs/01-feasibility-and-cost.md.

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3-turbo";

type GroqWord = { word: string; start: number; end: number };
type GroqVerboseJsonResponse = {
  language?: string;
  words?: GroqWord[];
  error?: { message?: string };
};

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }
  return key;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No video/audio file provided." }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = getGroqApiKey();
  } catch (err) {
    console.error("transcribe route config error", err);
    return NextResponse.json(
      { error: "Transcription is temporarily unavailable." },
      { status: 500 }
    );
  }

  const outgoing = new FormData();
  outgoing.set("file", file, file.name);
  outgoing.set("model", GROQ_MODEL);
  outgoing.set("response_format", "verbose_json");
  outgoing.append("timestamp_granularities[]", "word");

  let groqResponse: Response;
  try {
    groqResponse = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outgoing,
    });
  } catch (err) {
    console.error("transcribe route network error", err);
    return NextResponse.json(
      { error: "Could not reach the transcription service. Please try again." },
      { status: 502 }
    );
  }

  if (!groqResponse.ok) {
    const body = (await groqResponse.json().catch(() => null)) as GroqVerboseJsonResponse | null;
    console.error("groq transcription failed", groqResponse.status, body?.error?.message);

    if (groqResponse.status === 429) {
      return NextResponse.json(
        { error: "Transcription is rate-limited right now. Please try again shortly.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    if (groqResponse.status === 413) {
      return NextResponse.json(
        { error: "This file is too large to transcribe. Try trimming it to a shorter clip." },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: "Transcription failed. Please try a different file." },
      { status: groqResponse.status >= 500 ? 502 : 400 }
    );
  }

  const data = (await groqResponse.json()) as GroqVerboseJsonResponse;

  const words = (data.words ?? []).map((w) => ({
    text: w.word,
    startMs: Math.round(w.start * 1000),
    endMs: Math.round(w.end * 1000),
  }));

  return NextResponse.json({ words, language: data.language ?? "en" });
}
