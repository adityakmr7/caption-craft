"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import UploadDropzone from "./components/UploadDropzone";
import VideoStage from "./components/VideoStage";
import Timeline from "./components/Timeline";
import TranscribePanel from "./components/TranscribePanel";
import ExportPanel from "./components/ExportPanel";
import PipelineStepper from "./components/PipelineStepper";
import { probeVideo } from "@/app/lib/video/probeVideo";
import type { Track } from "@/app/lib/captions/types";

type LoadedVideo = {
  file: File;
  previewUrl: string;
  durationMs: number;
};

export default function StudioApp() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loaded, setLoaded] = useState<LoadedVideo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [trimInMs, setTrimInMs] = useState(0);
  const [trimOutMs, setTrimOutMs] = useState(0);
  const [track, setTrack] = useState<Track | null>(null);

  const onFileSelected = useCallback(async (file: File) => {
    setUploadError(null);
    setTrack(null);
    try {
      const probe = await probeVideo(file);
      setLoaded({ file, previewUrl: probe.objectUrl, durationMs: probe.durationMs });
      setTrimInMs(0);
      setTrimOutMs(probe.durationMs);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not load this video.");
    }
  }, []);

  // Revoke the object URL when a new video replaces the old one / on unmount.
  useEffect(() => {
    return () => {
      if (loaded) URL.revokeObjectURL(loaded.previewUrl);
    };
  }, [loaded]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--text-1)]">Studio</h1>
        <p className="text-sm text-[var(--text-2)]">
          Upload a clip, trim it, generate captions, and export — all processed in your browser.
        </p>
      </div>

      <PipelineStepper hasFile={!!loaded} hasTrack={!!track} isExporting={false} />

      {!loaded && <UploadDropzone onFileSelected={onFileSelected} error={uploadError} />}

      {loaded && (
        <>
          <VideoStage previewUrl={loaded.previewUrl} track={track} trimInMs={trimInMs} videoRef={videoRef} />

          <Timeline
            durationMs={loaded.durationMs}
            trimInMs={trimInMs}
            trimOutMs={trimOutMs}
            onTrimChange={(inMs, outMs) => {
              setTrimInMs(inMs);
              setTrimOutMs(outMs);
            }}
            videoRef={videoRef}
          />

          <TranscribePanel
            file={loaded.file}
            trimInMs={trimInMs}
            trimOutMs={trimOutMs}
            onTranscribed={setTrack}
          />

          {track && (
            <ExportPanel file={loaded.file} trimInMs={trimInMs} trimOutMs={trimOutMs} track={track} />
          )}

          <button
            type="button"
            className="btn-ghost self-start px-4 py-2 text-xs"
            onClick={() => {
              setLoaded(null);
              setTrack(null);
              setUploadError(null);
            }}
          >
            Start over with a different video
          </button>
        </>
      )}
    </div>
  );
}
