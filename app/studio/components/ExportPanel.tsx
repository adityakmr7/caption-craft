"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/app/lib/captions/types";
import type { ExportWorkerRequest, ExportWorkerResponse } from "@/app/lib/video/export.worker";

type ExportPanelProps = {
  file: File;
  trimInMs: number;
  trimOutMs: number;
  track: Track;
};

function isWebCodecsExportSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "VideoEncoder" in window &&
    "VideoDecoder" in window &&
    "AudioEncoder" in window &&
    "OffscreenCanvas" in window
  );
}

// Runs the export inside a dedicated Worker (app/lib/video/export.worker.ts)
// so decode -> composite -> encode across the whole clip doesn't freeze the
// UI. See the Phase 1 plan's "Web Worker — where it's actually needed".
export default function ExportPanel({ file, trimInMs, trimOutMs, track }: ExportPanelProps) {
  const [status, setStatus] = useState<"idle" | "exporting" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  // Defaults to unsupported (matches server-rendered output) until the
  // effect below confirms it client-side — avoids a hydration mismatch from
  // reading a browser-only global during render.
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time browser capability check, deferred to avoid a hydration mismatch
    setSupported(isWebCodecsExportSupported());
  }, []);

  // Runs on unmount only; reads the ref (not `downloadUrl` directly) so it
  // always revokes whichever blob URL is current, not the one from mount.
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  const runExport = () => {
    if (status === "exporting") return; // guard against duplicate exports

    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
      setDownloadUrl(null);
    }

    setStatus("exporting");
    setProgress(0);
    setError(null);

    const worker = new Worker(new URL("../../lib/video/export.worker.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<ExportWorkerResponse>) => {
      const msg = event.data;
      if (msg.type === "progress") {
        setProgress(msg.fraction);
      } else if (msg.type === "done") {
        setStatus("done");
        const url = URL.createObjectURL(msg.blob);
        downloadUrlRef.current = url;
        setDownloadUrl(url);
        worker.terminate();
      } else if (msg.type === "error") {
        setStatus("error");
        setError(msg.message);
        worker.terminate();
      }
    };

    worker.onerror = (event) => {
      setStatus("error");
      setError(event.message || "Export failed.");
      worker.terminate();
    };

    const request: ExportWorkerRequest = { type: "export", job: { file, trimInMs, trimOutMs, track } };
    worker.postMessage(request);
  };

  if (!supported) {
    return (
      <div className="glass-card rounded-xl p-4 text-sm text-amber-400">
        Export requires a recent Chrome, Edge, or Safari 26+ (WebCodecs support). Your browser can still preview
        captions, but can&apos;t burn them into a downloadable file yet.
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col gap-3 rounded-xl p-4">
      <button
        type="button"
        className="btn-gradient px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        onClick={runExport}
        disabled={status === "exporting"}
      >
        {status === "exporting" ? `Exporting… ${Math.round(progress * 100)}%` : "Export MP4"}
      </button>
      {status === "exporting" && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full transition-[width]"
            style={{ width: `${progress * 100}%`, backgroundImage: "var(--gradient)" }}
          />
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {downloadUrl && (
        <a href={downloadUrl} download="caption-craft-export.mp4" className="btn-ghost px-4 py-2 text-center text-sm">
          Download video
        </a>
      )}
    </div>
  );
}
