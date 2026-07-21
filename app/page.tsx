import type { Metadata } from "next";
import CaptionCraftLanding from "./components/CaptionCraftLanding";

const title = "CaptionCraft — Viral-Ready Captions in 30 Seconds";
const description =
  "Upload your video and get auto-generated, styled captions for TikTok, Reels and Shorts. No editing skills needed. Join the waitlist for 50% off forever.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "CaptionCraft",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function Home() {
  return <CaptionCraftLanding />;
}
