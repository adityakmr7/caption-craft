import type { Metadata } from "next";
import CaptionCraftLanding from "./components/CaptionCraftLanding";

const title = "CaptionCraft — Screenshot in, LinkedIn post out";
const description =
  "Upload a screenshot of your milestone and get 3 ready-to-post LinkedIn variations with hashtags, written for Indian founders building in public.";

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
