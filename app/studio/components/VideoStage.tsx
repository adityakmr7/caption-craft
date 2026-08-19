"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { drawCaptionFrame } from "@/app/lib/captions/renderer";
import type { Track } from "@/app/lib/captions/types";

type VideoStageProps = {
  previewUrl: string;
  track: Track | null;
  trimInMs: number;
  videoRef: RefObject<HTMLVideoElement | null>;
};

// Live caption preview: a <canvas> layered over the <video>, redrawn via the
// shared drawCaptionFrame() renderer (see app/lib/captions/renderer.ts) —
// the same function the export Worker uses for burn-in. Main-thread only;
// this is cheap 2D canvas work, no Worker needed here (see the Phase 1 plan).
export default function VideoStage({ previewUrl, track, trimInMs, videoRef }: VideoStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Read via refs inside the rAF loop so the effect below doesn't need to
  // re-subscribe every time track/trimInMs change.
  const trackRef = useRef(track);
  const trimInRef = useRef(trimInMs);
  useEffect(() => {
    trackRef.current = track;
    trimInRef.current = trimInMs;
  }, [track, trimInMs]);

  // Keep the canvas's backing resolution in sync with its displayed size.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number | null = null;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentTrack = trackRef.current;
      if (currentTrack) {
        const tMs = video.currentTime * 1000 - trimInRef.current;
        drawCaptionFrame(ctx, currentTrack, tMs, canvas.width, canvas.height);
      }
    };

    const loop = () => {
      draw();
      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    };

    const onPlay = () => {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    };
    const redraw = () => draw();

    video.addEventListener("play", onPlay);
    video.addEventListener("seeked", redraw);
    video.addEventListener("timeupdate", redraw);
    video.addEventListener("pause", redraw);

    draw();

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("seeked", redraw);
      video.removeEventListener("timeupdate", redraw);
      video.removeEventListener("pause", redraw);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [videoRef]);

  // Playback/scrubbing controls live in Timeline.tsx below this stage —
  // no native <video controls>, so there's exactly one transport UI.
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  return (
    <div ref={containerRef} className="relative w-full cursor-pointer overflow-hidden rounded-xl bg-black">
      <video ref={videoRef} src={previewUrl} onClick={togglePlay} className="block w-full" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
