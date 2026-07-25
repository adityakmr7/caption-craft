"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, Download, RotateCcw } from "lucide-react";
import { CAPTION_STYLES, CAPTION_STYLE_IDS } from "@/app/lib/captions/styles";
import type { FileData } from "@ffmpeg/ffmpeg";

type Stage =
  | "idle"
  | "extracting-audio"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_BYTES = 100 * 1024 * 1024;

export function VideoUpload() {
  const [style, setStyle] = useState("bold");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = stage === "extracting-audio" || stage === "uploading" || stage === "processing";

  function pickFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setStage("error");
      setErrorMessage("Unsupported format. Use MP4, MOV, or WebM.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setStage("error");
      setErrorMessage("Video must be 100MB or smaller.");
      return;
    }
    setFile(candidate);
    setStage("idle");
    setErrorMessage("");
  }

  async function handleSubmit() {
    if (!file || busy) return;

    try {
      setStage("extracting-audio");
      const audioBlob = await extractAudio(file);

      setStage("uploading");
      const form = new FormData();
      form.append("video", file);
      form.append("audio", audioBlob, "audio.mp3");
      form.append("style", style);

      setStage("processing");
      const res = await fetch("/api/videos", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setResultUrl(data.processedUrl);
      setStage("completed");
    } catch (err) {
      setStage("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function reset() {
    setFile(null);
    setStage("idle");
    setErrorMessage("");
    setResultUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (stage === "completed") {
    return (
      <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" strokeWidth={2} />
        <p className="text-lg font-semibold text-white">Your video is ready</p>
        <div className="flex gap-3">
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            Download
          </a>
          <button onClick={reset} className="btn-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold">
            <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            Caption another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <p className="mb-3 text-sm font-semibold text-white">Style</p>
      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {CAPTION_STYLE_IDS.map((id) => {
          const s = CAPTION_STYLES[id];
          const active = style === id;
          return (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => setStyle(id)}
              className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-[#a855f7]/50 bg-[#a855f7]/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-[#a1a1aa] hover:border-white/20"
              }`}
            >
              <span style={{ color: active ? s.color : undefined }}>{s.name}</span>
            </button>
          );
        })}
      </div>

      <label
        className={`flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
          file ? "border-[#a855f7]/40 bg-[#a855f7]/[0.04]" : "border-white/15 hover:border-white/25"
        } ${busy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          disabled={busy}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <UploadCloud className="h-8 w-8 text-[#71717a]" strokeWidth={1.5} />
        <p className="text-sm text-white">
          {file ? file.name : "Drop a video or click to browse"}
        </p>
        <p className="text-xs text-[#71717a]">MP4, MOV, or WebM — up to 100MB</p>
      </label>

      {stage === "error" && (
        <p className="mt-4 text-sm text-red-400">{errorMessage}</p>
      )}

      <button
        type="button"
        disabled={!file || busy}
        onClick={handleSubmit}
        className="btn-gradient mt-6 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />}
        {stageLabel(stage)}
      </button>
    </div>
  );
}

function stageLabel(stage: Stage): string {
  switch (stage) {
    case "extracting-audio":
      return "Extracting audio...";
    case "uploading":
      return "Uploading...";
    case "processing":
      return "Captioning your video...";
    default:
      return "Add captions";
  }
}

async function extractAudio(file: File): Promise<Blob> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL, fetchFile } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  let sawAudioStream = false;
  ffmpeg.on("log", ({ message }) => {
    if (/Stream #\d+:\d+.*Audio/i.test(message)) sawAudioStream = true;
  });

  const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
  } catch {
    throw new Error(
      "Couldn't load the audio processor. Check your connection and try again."
    );
  }

  const inputName = "input" + fileExtension(file.name);
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  if (!sawAudioStream) {
    // ffmpeg logs stream info before exec() finishes; give it a moment.
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const exitCode = await ffmpeg
    .exec(["-i", inputName, "-vn", "-acodec", "libmp3lame", "-q:a", "4", "audio.mp3"])
    .catch(() => -1);

  if (!sawAudioStream) {
    throw new Error("This video doesn't have an audio track, so there's nothing to caption.");
  }
  if (exitCode !== 0) {
    throw new Error("Couldn't process this video's audio. Try a different file.");
  }

  let data: FileData;
  try {
    data = await ffmpeg.readFile("audio.mp3");
  } catch {
    throw new Error("Couldn't extract audio from this video. Try a different file.");
  }

  return new Blob([new Uint8Array(data as Uint8Array)], { type: "audio/mp3" });
}

function fileExtension(name: string): string {
  const match = name.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0] : ".mp4";
}
