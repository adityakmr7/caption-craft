import { ImageResponse } from "next/og";

// Keep this glyph in sync with BrandGlyph in
// app/components/CaptionCraftLanding.tsx and with app/icon.tsx.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c17d1f",
          borderRadius: 40,
        }}
      >
        <svg
          width="108"
          height="108"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 14V5h9M10 15h9M13 19h6"
            stroke="#171310"
            strokeWidth={2.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
