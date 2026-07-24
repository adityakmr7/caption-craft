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
 * Transcribes audio via OpenAI's hosted Whisper API (whisper-1) and returns
 * word-level timestamps. Local/self-hosted transcription was benchmarked
 * and ruled out - see docs/ARCHITECTURE.md Section 10.1.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<TimedWord[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audioBuffer)]), filename);
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
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
