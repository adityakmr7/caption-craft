import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import path from "node:path";
import type { CaptionStyle } from "./styles";

let fontRegistered = false;

function ensureFont() {
  if (fontRegistered) return;
  const fontPath = path.join(process.cwd(), "public/fonts/Inter-Bold.ttf");
  GlobalFonts.registerFromPath(fontPath, "Inter");
  fontRegistered = true;
}

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

function wrapLines(
  ctx: ReturnType<typeof createCanvas>["getContext"] extends (t: "2d") => infer C ? C : never,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Renders one caption card (a word, for word-mode styles, or a short
 * phrase, for group-mode styles) to a transparent PNG buffer sized to the
 * full output canvas, positioned per the style's yAnchor.
 */
export function renderCaptionImage(rawText: string, style: CaptionStyle): Buffer {
  ensureFont();

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  const text = style.uppercase ? rawText.toUpperCase() : rawText;
  const maxWidth = CANVAS_WIDTH * style.maxWidthFraction;

  ctx.font = `${style.fontWeight} ${style.fontSize}px Inter`;
  ctx.textBaseline = "alphabetic";

  const lines = wrapLines(ctx, text, maxWidth);
  const lineHeight = style.fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;

  const centerY = CANVAS_HEIGHT * style.yAnchor;
  const startY = centerY - totalTextHeight / 2 + style.fontSize * 0.85;

  if (style.boxColor) {
    let maxLineWidth = 0;
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
    }
    const paddingX = 32;
    const paddingY = 20;
    const boxW = maxLineWidth + paddingX * 2;
    const boxH = totalTextHeight + paddingY * 2;
    const boxX = (CANVAS_WIDTH - boxW) / 2;
    const boxY = centerY - totalTextHeight / 2 - paddingY;
    const radius = style.boxRadius ?? 0;

    ctx.fillStyle = style.boxColor;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fill();
  }

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    const lineWidth = ctx.measureText(line).width;
    let x = (CANVAS_WIDTH - lineWidth) / 2;

    if (style.letterSpacing) {
      // Draw glyph-by-glyph when letter-spacing is requested — canvas has
      // no native letter-spacing, and re-measuring per glyph keeps lines centered.
      const totalWidth =
        lineWidth + style.letterSpacing * Math.max(0, line.length - 1);
      x = (CANVAS_WIDTH - totalWidth) / 2;
      for (const ch of line) {
        drawGlyph(ctx, ch, x, y, style);
        x += ctx.measureText(ch).width + style.letterSpacing;
      }
      return;
    }

    drawGlyph(ctx, line, x, y, style);
  });

  return canvas.toBuffer("image/png");
}

function drawGlyph(
  ctx: ReturnType<typeof createCanvas>["getContext"] extends (t: "2d") => infer C ? C : never,
  text: string,
  x: number,
  y: number,
  style: CaptionStyle
) {
  if (style.glowColor) {
    ctx.save();
    ctx.shadowColor = style.glowColor;
    ctx.shadowBlur = style.glowBlur ?? 24;
    ctx.fillStyle = style.color;
    ctx.fillText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  if (style.strokeColor && style.strokeWidth) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.strokeText(text, x, y);
  }

  ctx.fillStyle = style.color;
  ctx.fillText(text, x, y);
}
