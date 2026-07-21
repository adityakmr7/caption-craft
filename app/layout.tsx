import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaptionCraft — Viral-Ready Captions in 30 Seconds",
  description:
    "Upload your video and get auto-generated, styled captions for TikTok, Reels and Shorts. No editing skills needed. Join the waitlist for 50% off forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f]">
        {children}
      </body>
    </html>
  );
}
