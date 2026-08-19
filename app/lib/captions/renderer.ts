import type { Line, Track } from "./types";

// The one shared caption draw function — see docs/03-caption-style-system.md:
// "Write the renderer once against (word, styleConfig, tMs) → draw
// instructions, and run it in two contexts with zero duplicated logic."
//
// It only touches the 2D canvas context API (no `document`, no DOM), so the
// exact same function runs against a live-preview <canvas> on the main
// thread and against an OffscreenCanvas inside the export Worker.

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Draws whichever caption line is active at `tMs` (in milliseconds, relative
 * to the start of the track's timeline) onto `ctx`, sized for a frame of
 * `frameWidth` x `frameHeight`. Draws nothing if no line is active.
 */
export function drawCaptionFrame(
  ctx: Canvas2DContext,
  track: Track,
  tMs: number,
  frameWidth: number,
  frameHeight: number
): void {
  const { style } = track;
  const line = findActiveLine(track.lines, tMs);
  if (!line) return;

  const opacity = computeLineOpacity(line, tMs, style.animation.durationMs);
  if (opacity <= 0) return;

  const text = line.words.map((w) => w.text).join(" ");
  if (!text) return;

  const fontSizePx = Math.max(1, Math.round(style.typography.fontSizeRatio * frameHeight));
  const lineHeightPx = fontSizePx * style.typography.lineHeightRatio;
  const paddingX = fontSizePx * style.background.paddingRatio;
  const paddingY = paddingX * 0.5;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${style.typography.fontWeight} ${fontSizePx}px ${style.typography.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  applyLetterSpacing(ctx, style.typography.letterSpacingPx);

  const textWidth = ctx.measureText(text).width;
  const centerX = frameWidth / 2;
  const centerY = computeCenterY(style.position, frameHeight, lineHeightPx + paddingY * 2);

  if (style.background.shape !== "none") {
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = lineHeightPx + paddingY * 2;
    drawRoundedRect(
      ctx,
      centerX - boxWidth / 2,
      centerY - boxHeight / 2,
      boxWidth,
      boxHeight,
      style.background.cornerRadiusPx
    );
    ctx.fillStyle = style.color.background;
    ctx.fill();
  }

  if (style.color.shadowBlurPx) {
    ctx.shadowBlur = style.color.shadowBlurPx;
    ctx.shadowColor = style.color.shadowColor ?? "rgba(0, 0, 0, 0.5)";
  }

  if (style.color.stroke && style.color.strokeWidthPx) {
    ctx.lineWidth = style.color.strokeWidthPx;
    ctx.strokeStyle = style.color.stroke;
    ctx.strokeText(text, centerX, centerY);
  }

  ctx.fillStyle = style.color.text;
  ctx.fillText(text, centerX, centerY);

  ctx.restore();
}

function findActiveLine(lines: Line[], tMs: number): Line | undefined {
  return lines.find((line) => tMs >= line.startMs && tMs < line.endMs);
}

/** Simple fade in/out over `durationMs` at each end of the line's window. */
function computeLineOpacity(
  line: Line,
  tMs: number,
  durationMs: number
): number {
  if (durationMs <= 0) return 1;
  const sinceStart = tMs - line.startMs;
  const untilEnd = line.endMs - tMs;
  const fadeIn = clamp01(sinceStart / durationMs);
  const fadeOut = clamp01(untilEnd / durationMs);
  return Math.min(fadeIn, fadeOut);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function computeCenterY(
  position: Track["style"]["position"],
  frameHeight: number,
  boxHeight: number
): number {
  const safeMarginPx = position.safeZoneMarginRatio * frameHeight;
  switch (position.anchor) {
    case "top":
      return safeMarginPx + boxHeight / 2;
    case "center":
      return frameHeight / 2;
    case "bottom":
    default:
      return frameHeight - safeMarginPx - boxHeight / 2;
  }
}

function applyLetterSpacing(ctx: Canvas2DContext, letterSpacingPx: number): void {
  if (!letterSpacingPx) return;
  // `letterSpacing` is a newer canvas 2D property; guard for older engines.
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D).letterSpacing = `${letterSpacingPx}px`;
  }
}

function drawRoundedRect(
  ctx: Canvas2DContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
