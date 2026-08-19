import type { Metadata } from "next";
import StudioApp from "./StudioApp";

export const metadata: Metadata = {
  title: "Studio — CaptionCraft",
  description: "Upload, trim, and caption your video — processed entirely in your browser.",
};

export default function StudioPage() {
  return <StudioApp />;
}
