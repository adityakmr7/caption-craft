export type CaptionMode = "word" | "group";

export interface CaptionStyle {
  id: string;
  name: string;
  mode: CaptionMode;
  fontSize: number;
  fontWeight: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  glowColor?: string;
  glowBlur?: number;
  boxColor?: string;
  boxRadius?: number;
  uppercase?: boolean;
  letterSpacing?: number;
  /** vertical anchor as a fraction of canvas height, 0 = top, 1 = bottom */
  yAnchor: number;
  maxWidthFraction: number;
}

// Canvas target: 1080x1920 (9:16). Values below are tuned for that frame.
export const CAPTION_STYLES: Record<string, CaptionStyle> = {
  bold: {
    id: "bold",
    name: "Bold",
    mode: "word",
    fontSize: 110,
    fontWeight: 900,
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 14,
    uppercase: true,
    yAnchor: 0.5,
    maxWidthFraction: 0.85,
  },
  neon: {
    id: "neon",
    name: "Neon",
    mode: "word",
    fontSize: 96,
    fontWeight: 800,
    color: "#f472b6",
    glowColor: "#a855f7",
    glowBlur: 40,
    yAnchor: 0.5,
    maxWidthFraction: 0.85,
  },
  karaoke: {
    id: "karaoke",
    name: "Karaoke",
    mode: "word",
    fontSize: 100,
    fontWeight: 800,
    color: "#34d399",
    strokeColor: "#000000",
    strokeWidth: 10,
    uppercase: true,
    yAnchor: 0.5,
    maxWidthFraction: 0.85,
  },
  retro: {
    id: "retro",
    name: "Retro",
    mode: "group",
    fontSize: 62,
    fontWeight: 800,
    color: "#fbbf24",
    strokeColor: "#000000",
    strokeWidth: 6,
    boxColor: "rgba(0,0,0,0.35)",
    boxRadius: 16,
    uppercase: true,
    letterSpacing: 2,
    yAnchor: 0.82,
    maxWidthFraction: 0.88,
  },
  cinematic: {
    id: "cinematic",
    name: "Cinematic",
    mode: "group",
    fontSize: 48,
    fontWeight: 500,
    color: "#ffffff",
    boxColor: "rgba(0,0,0,0.5)",
    boxRadius: 12,
    yAnchor: 0.85,
    maxWidthFraction: 0.82,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    mode: "group",
    fontSize: 44,
    fontWeight: 500,
    color: "#e5e5e5",
    yAnchor: 0.88,
    maxWidthFraction: 0.8,
  },
};

export const CAPTION_STYLE_IDS = Object.keys(CAPTION_STYLES);

export function getCaptionStyle(id: string): CaptionStyle {
  const style = CAPTION_STYLES[id];
  if (!style) {
    throw new Error(`Unknown caption style: ${id}`);
  }
  return style;
}
