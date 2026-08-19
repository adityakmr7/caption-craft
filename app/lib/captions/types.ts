// Caption data model — see docs/03-caption-style-system.md.
//
// Word/Line/Track is the shared schema every caption style renders against.
// Phase 1 ships one StyleConfig (Classic Bar); the shape below already
// supports the full v1 catalog so later styles are just new config objects,
// not new render code.

export type Word = {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
};

export type Line = {
  words: Word[];
  startMs: number;
  endMs: number;
};

export type StyleConfig = {
  id: string;
  typography: {
    fontFamily: string;
    fontWeight: number;
    /** Relative to frame height (e.g. 0.06 = 6% of frame height), so it scales across aspect ratios. */
    fontSizeRatio: number;
    letterSpacingPx: number;
    lineHeightRatio: number;
    maxLines: number;
    maxCharsPerLine: number;
  };
  color: {
    text: string;
    activeText: string;
    background: string;
    stroke?: string;
    strokeWidthPx?: number;
    shadowBlurPx?: number;
    shadowColor?: string;
  };
  position: {
    anchor: "top" | "center" | "bottom";
    safeZoneMarginRatio: number;
  };
  animation: {
    type: "none" | "pop" | "bounce" | "reveal" | "fade";
    durationMs: number;
    trigger: "word" | "line";
  };
  background: {
    shape: "none" | "bar" | "pill-per-word" | "box";
    paddingRatio: number;
    cornerRadiusPx: number;
  };
};

export type Track = {
  lines: Line[];
  lang: string;
  style: StyleConfig;
};
