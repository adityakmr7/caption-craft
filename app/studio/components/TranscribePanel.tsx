"use client";

import { useState } from "react";
import { buildTrackFromGroq, type NormalizedTranscription } from "@/app/lib/transcription/buildTrackFromGroq";
import { MAX_TRANSCRIBE_UPLOAD_BYTES } from "@/app/lib/video/probeVideo";
import type { Track } from "@/app/lib/captions/types";

type TranscribePanelProps = {
  file: File;
  trimInMs: number;
  trimOutMs: number;
  onTranscribed: (track: Track) => void;
};

// Sends the full original file (not a pre-trimmed slice) to /api/transcribe
// and filters/rebases the returned words to the trim window client-side —
// see the "Transcribe" stage rationale in the Phase 1 plan.
export default function TranscribePanel({ file, trimInMs, trimOutMs, onTranscribed }: TranscribePanelProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const transcribe = async () => {
    if (status === "loading") return; // guard against duplicate Groq calls from a double click

    if (file.size > MAX_TRANSCRIBE_UPLOAD_BYTES) {
      setStatus("error");
      setError("This file is too large to transcribe. Trim it to a shorter clip first.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const form = new FormData();
      form.set("file", file);

      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Transcription failed.");
      }

      const track = buildTrackFromGroq(data as NormalizedTranscription, { trimInMs, trimOutMs });
      setStatus("idle");
      onTranscribed(track);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Transcription failed.");
    }
  };

  return (
    <div className="glass-card flex flex-col gap-3 rounded-xl p-4">
      <button
        type="button"
        className="btn-gradient px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        onClick={transcribe}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Transcribing…" : "Transcribe"}
      </button>
      {error && (
        <div className="flex items-center justify-between gap-3 text-xs text-red-400">
          <span>{error}</span>
          <button type="button" className="btn-ghost shrink-0 px-3 py-1" onClick={transcribe}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
