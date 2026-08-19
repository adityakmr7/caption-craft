import { CLASSIC_BAR_STYLE } from "@/app/lib/captions/classicBarStyle";
import { groupWordsIntoLines } from "@/app/lib/captions/groupWordsIntoLines";
import type { Track, Word } from "@/app/lib/captions/types";

export type NormalizedTranscription = {
  words: { text: string; startMs: number; endMs: number; confidence?: number }[];
  language: string;
};

export type TrimWindow = {
  trimInMs: number;
  trimOutMs: number;
};

/**
 * Converts the server's normalized transcription response into a Track,
 * keeping only words that fall inside the trim window and rebasing their
 * timestamps to start at 0 — so caption timing lines up with the trimmed
 * export/preview timeline (see docs/04-editor-ux.md's edit-decision-list
 * approach; Phase 1 has a single trim range instead of a full EDL).
 */
export function buildTrackFromGroq(
  transcription: NormalizedTranscription,
  trim: TrimWindow
): Track {
  const words: Word[] = transcription.words
    .filter((w) => w.startMs >= trim.trimInMs && w.endMs <= trim.trimOutMs)
    .map((w) => ({
      text: w.text,
      startMs: w.startMs - trim.trimInMs,
      endMs: w.endMs - trim.trimInMs,
      confidence: w.confidence,
    }));

  const lines = groupWordsIntoLines(words, {
    maxCharsPerLine: CLASSIC_BAR_STYLE.typography.maxCharsPerLine,
  });

  return {
    lines,
    lang: transcription.language,
    style: CLASSIC_BAR_STYLE,
  };
}
