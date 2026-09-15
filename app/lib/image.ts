// Shared screenshot upload constraints — used by both /api/generate and
// /api/extract-facts so the two routes can't silently drift apart on what
// counts as a valid upload.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB, per PRD §7.1
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function validateImageFile(file: unknown): string | null {
  if (!(file instanceof File)) return "Upload a screenshot.";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Screenshot must be PNG, JPEG, or WebP.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Screenshot must be under 10MB.";
  return null;
}
