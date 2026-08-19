export type VideoProbeResult = {
  durationMs: number;
  width: number;
  height: number;
  objectUrl: string;
};

/**
 * Reads duration/dimensions off a video File by loading it into a detached
 * <video> element and waiting for `loadedmetadata` — cheap, no WebCodecs
 * needed just to probe. Caller owns the returned `objectUrl` and is
 * responsible for revoking it (e.g. via `URL.revokeObjectURL`) when done.
 */
export function probeVideo(file: File): Promise<VideoProbeResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = objectUrl;

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
    };

    const onLoaded = () => {
      cleanup();
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not read a valid duration from this video."));
        return;
      }
      resolve({
        durationMs: video.duration * 1000,
        width: video.videoWidth,
        height: video.videoHeight,
        objectUrl,
      });
    };

    const onError = () => {
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This file could not be read as a video."));
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
  });
}

export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
/** Soft warning threshold, not a hard block — the user's own machine does the work. */
export const SOFT_SIZE_WARNING_BYTES = 500 * 1024 * 1024;
/** Groq's free-tier request size cap; validate before upload rather than surface a raw 413. */
export const MAX_TRANSCRIBE_UPLOAD_BYTES = 25 * 1024 * 1024;
