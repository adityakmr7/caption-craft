import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  type VideoSample,
} from "mediabunny";
import { drawCaptionFrame } from "@/app/lib/captions/renderer";
import type { Track } from "@/app/lib/captions/types";

export type ExportJob = {
  file: File;
  trimInMs: number;
  trimOutMs: number;
  track: Track;
};

/**
 * Trims to [trimInMs, trimOutMs], burns in captions from `track`, and muxes
 * the result into a playable MP4 Blob — all via Mediabunny/WebCodecs.
 * Mediabunny both decodes/re-encodes AND muxes (see docs/01's note that
 * WebCodecs alone only yields raw encoded chunks, not a playable file).
 *
 * DOM-free aside from OffscreenCanvas, which is available both on the main
 * thread and inside a Worker — this is meant to be called from
 * `export.worker.ts`, not the main thread, since decode/encode across a
 * whole clip would otherwise jank the UI.
 */
export async function runExportPipeline(
  job: ExportJob,
  onProgress?: (fraction: number) => void
): Promise<Blob> {
  const { file, trimInMs, trimOutMs, track } = job;

  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });

  // Reused across frames rather than allocated per-frame.
  let overlayCanvas: OffscreenCanvas | null = null;
  let overlayCtx: OffscreenCanvasRenderingContext2D | null = null;

  const conversion = await Conversion.init({
    input,
    output,
    trim: { start: trimInMs / 1000, end: trimOutMs / 1000 },
    video: {
      codec: "avc", // force H.264 for broad playback compatibility, not a codec default that might pick AV1
      process: (sample: VideoSample) => {
        const width = sample.displayWidth;
        const height = sample.displayHeight;

        if (!overlayCanvas || overlayCanvas.width !== width || overlayCanvas.height !== height) {
          overlayCanvas = new OffscreenCanvas(width, height);
          overlayCtx = overlayCanvas.getContext("2d");
        }
        if (!overlayCtx) return sample;

        overlayCtx.clearRect(0, 0, width, height);
        sample.draw(overlayCtx, 0, 0, width, height);

        // By this point Mediabunny has already rebased the sample's
        // timestamp against the trim window, so tMs=0 lines up with the
        // same trim-relative timeline buildTrackFromGroq produced.
        const tMs = sample.timestamp * 1000;
        drawCaptionFrame(overlayCtx, track, tMs, width, height);

        return overlayCanvas;
      },
    },
  });

  if (onProgress) {
    conversion.onProgress = (progress) => onProgress(progress);
  }

  await conversion.execute();

  const buffer = output.target.buffer;
  if (!buffer) {
    throw new Error("Export finished without producing an output file.");
  }
  return new Blob([buffer], { type: "video/mp4" });
}
