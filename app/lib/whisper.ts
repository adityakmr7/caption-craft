import type { TimedWord } from "./captions/group-words";

interface WhisperWordResponse {
  word: string;
  start: number;
  end: number;
}

interface WhisperVerboseResponse {
  words?: WhisperWordResponse[];
}

/**
 * Transcribes audio via Groq's hosted Whisper API and returns word-level
 * timestamps. Groq's endpoint is OpenAI-compatible (same request/response
 * shape as api.openai.com/v1/audio/transcriptions) - swapping back to
 * OpenAI later just means changing the base URL, key, and model name below.
 * Using Groq for now: decent free tier, good for development testing.
 * whisper-large-v3-turbo is the cheap/fast tier ($0.04/hr, 12% WER);
 * whisper-large-v3 is more accurate but ~3x the cost ($0.111/hr, 10.3% WER).
 * Local/self-hosted transcription was benchmarked and ruled out either way
 * - see docs/ARCHITECTURE.md Section 10.1.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<TimedWord[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable");
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audioBuffer)]), filename);
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Whisper transcription failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as WhisperVerboseResponse;
  const words: TimedWord[] = (data.words ?? []).map((w) => ({
    text: w.word,
    start: w.start,
    end: w.end,
  }));

  if (words.length === 0) {
    throw new Error("Transcription returned no words - audio may be silent, too short, or unclear");
  }

  return words;
}
