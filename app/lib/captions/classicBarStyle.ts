import type { StyleConfig } from "./types";

// The single caption style shipped in Phase 1 — clean white text on a
// semi-transparent bar, bottom-third, line-level with a simple fade.
// Safe default per docs/03-caption-style-system.md.
export const CLASSIC_BAR_STYLE: StyleConfig = {
  id: "classic-bar",
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontWeight: 700,
    fontSizeRatio: 0.05,
    letterSpacingPx: 0,
    lineHeightRatio: 1.3,
    maxLines: 1,
    maxCharsPerLine: 42,
  },
  color: {
    text: "#ffffff",
    activeText: "#ffffff",
    background: "rgba(0, 0, 0, 0.6)",
    shadowBlurPx: 6,
    shadowColor: "rgba(0, 0, 0, 0.5)",
  },
  position: {
    anchor: "bottom",
    safeZoneMarginRatio: 0.1,
  },
  animation: {
    type: "fade",
    durationMs: 150,
    trigger: "line",
  },
  background: {
    shape: "bar",
    paddingRatio: 0.35,
    cornerRadiusPx: 6,
  },
};
