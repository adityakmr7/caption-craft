"use client";

import { useCallback, useRef, useState } from "react";
import { ACCEPTED_VIDEO_TYPES, SOFT_SIZE_WARNING_BYTES } from "@/app/lib/video/probeVideo";

type UploadDropzoneProps = {
  onFileSelected: (file: File) => void;
  error: string | null;
};

function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export default function UploadDropzone({ onFileSelected, error }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        onFileSelected(file); // let the parent surface a proper validation error via probeVideo's failure path too
        return;
      }

      setSizeWarning(
        file.size > SOFT_SIZE_WARNING_BYTES
          ? `That's a ${formatMb(file.size)} file — large videos may be slow to process in-browser.`
          : null
      );
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      className={`glass-card flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
        isDragging ? "border-[var(--accent-purple)]" : "border-[var(--border-glass)]"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <p className="text-lg font-medium text-[var(--text-1)]">Drop a video here</p>
      <p className="text-sm text-[var(--text-2)]">MP4, MOV, or WebM — processed entirely in your browser</p>
      <button type="button" className="btn-gradient mt-2 px-5 py-2.5 text-sm font-medium" onClick={() => inputRef.current?.click()}>
        Choose a file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {sizeWarning && <p className="text-xs text-amber-400">{sizeWarning}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
