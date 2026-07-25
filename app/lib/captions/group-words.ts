export interface TimedWord {
  text: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  text: string;
  start: number;
  end: number;
  words: TimedWord[];
}

const MAX_GROUP_WORDS = 5;
const MAX_GROUP_GAP_SECONDS = 0.5;

/**
 * Groups consecutive words into short phrases at natural pauses, for
 * group-mode caption styles. Word-mode styles use the raw TimedWord list
 * directly and don't need this.
 */
export function groupWords(words: TimedWord[]): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  let current: TimedWord[] = [];

  for (const word of words) {
    const prev = current[current.length - 1];
    const gap = prev ? word.start - prev.end : 0;

    if (current.length > 0 && (current.length >= MAX_GROUP_WORDS || gap > MAX_GROUP_GAP_SECONDS)) {
      segments.push(toSegment(current));
      current = [];
    }
    current.push(word);
  }

  if (current.length > 0) {
    segments.push(toSegment(current));
  }

  return segments;
}

function toSegment(words: TimedWord[]): CaptionSegment {
  return {
    text: words.map((w) => w.text).join(" "),
    start: words[0].start,
    end: words[words.length - 1].end,
    words,
  };
}
