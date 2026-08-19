import type { Line, Word } from "./types";

const DEFAULT_MAX_CHARS_PER_LINE = 42;
/** Once a line is this full (as a fraction of the char cap), prefer breaking on punctuation. */
const PUNCTUATION_BREAK_FULLNESS = 0.6;
/** A silence gap longer than this forces a line break regardless of char count. */
const GAP_BREAK_MS = 500;
/** A line lingering on screen longer than this gets cut even if short, for pacing. */
const MAX_LINE_DURATION_MS = 4500;

const PUNCTUATION_END_RE = /[.!?,—]$/;

export type GroupWordsOptions = {
  maxCharsPerLine?: number;
};

/**
 * Groups timed words into display lines for a line-level caption style.
 * Pure function, no DOM/React dependency, so it can run identically on the
 * server (if ever needed) or client, and is unit-testable in isolation.
 *
 * Break priority: max-chars ceiling > punctuation (once reasonably full) >
 * silence gap > max line duration. See docs/03-caption-style-system.md.
 */
export function groupWordsIntoLines(words: Word[], options: GroupWordsOptions = {}): Line[] {
  const maxChars = options.maxCharsPerLine ?? DEFAULT_MAX_CHARS_PER_LINE;
  const lines: Line[] = [];

  let current: Word[] = [];
  let currentChars = 0;

  const flush = () => {
    if (current.length === 0) return;
    lines.push({
      words: current,
      startMs: current[0].startMs,
      endMs: current[current.length - 1].endMs,
    });
    current = [];
    currentChars = 0;
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const addedChars = (currentChars > 0 ? 1 : 0) + word.text.length; // +1 for the joining space

    // Max-chars ceiling: never exceed, even mid-sentence.
    if (current.length > 0 && currentChars + addedChars > maxChars) {
      flush();
      current.push(word);
      currentChars = word.text.length;
      continue;
    }

    current.push(word);
    currentChars += addedChars;

    const isFullEnough = currentChars >= maxChars * PUNCTUATION_BREAK_FULLNESS;
    const endsOnPunctuation = PUNCTUATION_END_RE.test(word.text);
    const nextWord = words[i + 1];
    const gapToNextMs = nextWord ? nextWord.startMs - word.endMs : 0;
    const durationSoFarMs = word.endMs - current[0].startMs;

    if (
      (endsOnPunctuation && isFullEnough) ||
      (nextWord && gapToNextMs > GAP_BREAK_MS) ||
      durationSoFarMs > MAX_LINE_DURATION_MS
    ) {
      flush();
    }
  }

  flush();

  return lines;
}
