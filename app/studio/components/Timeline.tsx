"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Pause, Play } from "lucide-react";

type TimelineProps = {
  durationMs: number;
  trimInMs: number;
  trimOutMs: number;
  onTrimChange: (trimInMs: number, trimOutMs: number) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const MIN_GAP_MS = 200;

type DragTarget = "scrub" | "trimIn" | "trimOut" | null;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, ms) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${seconds}`;
}

/**
 * A real editor-style timeline: a single track spanning the full clip, a
 * playhead that can be dragged/clicked to scrub anywhere, and two trim
 * handles that can be dragged from wherever they currently sit to wherever
 * the user wants — not stepped controls. Trimmed-out regions dim; the kept
 * region stays highlighted. Phase 1's "basic trim" is still a single in/out
 * range (no ripple-cut multi-segment editing — that's docs/04, a later
 * phase), but the interaction now matches how every other video editor's
 * timeline behaves.
 */
export default function Timeline({ durationMs, trimInMs, trimOutMs, onTrimChange, videoRef }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<DragTarget>(null);

  const [currentMs, setCurrentMs] = useState(0);
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // The video element is the source of truth for playback position/state —
  // mirrors the pattern in VideoStage.tsx.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentMs(video.currentTime * 1000);
    const onSeeked = () => {
      setCurrentMs(video.currentTime * 1000);
      setScrubMs(null);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoRef]);

  const msFromClientX = (clientX: number): number => {
    const el = trackRef.current;
    if (!el || durationMs <= 0) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    return clamp(ratio, 0, 1) * durationMs;
  };

  const seek = (ms: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = ms / 1000;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const handleTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = "scrub";
    const ms = msFromClientX(e.clientX);
    setScrubMs(ms);
    seek(ms);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleTrackPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== "scrub") return;
    const ms = msFromClientX(e.clientX);
    setScrubMs(ms);
    seek(ms);
  };
  const handleTrackPointerUp = () => {
    if (draggingRef.current === "scrub") draggingRef.current = null;
  };

  const handleTrimHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>, which: "trimIn" | "trimOut") => {
    e.stopPropagation();
    draggingRef.current = which;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleTrimInPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== "trimIn") return;
    const next = clamp(msFromClientX(e.clientX), 0, trimOutMs - MIN_GAP_MS);
    onTrimChange(next, trimOutMs);
    seek(next);
  };
  const handleTrimOutPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current !== "trimOut") return;
    const next = clamp(msFromClientX(e.clientX), trimInMs + MIN_GAP_MS, durationMs);
    onTrimChange(trimInMs, next);
    seek(next);
  };
  const handleTrimHandlePointerUp = () => {
    draggingRef.current = null;
  };

  const playheadMs = scrubMs ?? currentMs;
  const pct = (ms: number) => (durationMs > 0 ? clamp((ms / durationMs) * 100, 0, 100) : 0);
  const trimInPct = pct(trimInMs);
  const trimOutPct = pct(trimOutMs);
  const playheadPct = pct(playheadMs);

  return (
    <div className="glass-card flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="btn-ghost flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
        <span className="font-mono text-xs tabular-nums text-[var(--text-2)]">
          {formatTime(playheadMs)} <span className="text-[var(--text-3)]">/ {formatTime(durationMs)}</span>
        </span>
        <span className="ml-auto font-mono text-xs tabular-nums text-[var(--text-3)]">
          Clip: {formatTime(trimOutMs - trimInMs)}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-16 w-full touch-none select-none rounded-lg bg-white/5"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
      >
        {/* trimmed-out regions, dimmed */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-l-lg bg-black/55"
          style={{ width: `${trimInPct}%` }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 rounded-r-lg bg-black/55"
          style={{ width: `${100 - trimOutPct}%` }}
        />
        {/* kept region outline */}
        <div
          className="pointer-events-none absolute inset-y-0 border-y-2"
          style={{
            left: `${trimInPct}%`,
            width: `${Math.max(0, trimOutPct - trimInPct)}%`,
            borderColor: "var(--accent-purple)",
          }}
        />

        {/* playhead */}
        <div
          className="pointer-events-none absolute -top-1 -bottom-1 z-20 w-0.5 bg-white"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
        </div>

        {/* trim handles — draggable from wherever they currently sit */}
        <div
          role="slider"
          aria-label="Trim start"
          aria-valuemin={0}
          aria-valuemax={durationMs}
          aria-valuenow={trimInMs}
          tabIndex={0}
          className="absolute top-0 bottom-0 z-30 flex w-3.5 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center"
          style={{ left: `${trimInPct}%` }}
          onPointerDown={(e) => handleTrimHandlePointerDown(e, "trimIn")}
          onPointerMove={handleTrimInPointerMove}
          onPointerUp={handleTrimHandlePointerUp}
        >
          <div className="h-full w-1.5 rounded-full shadow-lg" style={{ backgroundImage: "var(--gradient)" }} />
        </div>
        <div
          role="slider"
          aria-label="Trim end"
          aria-valuemin={0}
          aria-valuemax={durationMs}
          aria-valuenow={trimOutMs}
          tabIndex={0}
          className="absolute top-0 bottom-0 z-30 flex w-3.5 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center"
          style={{ left: `${trimOutPct}%` }}
          onPointerDown={(e) => handleTrimHandlePointerDown(e, "trimOut")}
          onPointerMove={handleTrimOutPointerMove}
          onPointerUp={handleTrimHandlePointerUp}
        >
          <div className="h-full w-1.5 rounded-full shadow-lg" style={{ backgroundImage: "var(--gradient)" }} />
        </div>
      </div>

      <div className="flex justify-between font-mono text-[10px] text-[var(--text-3)]">
        <span>0:00</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  );
}
