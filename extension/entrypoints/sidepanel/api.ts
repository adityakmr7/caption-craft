// Base URL for the CaptionCraft backend the side panel talks to. Extension
// pages (side panel/background) bypass CORS for origins declared in
// wxt.config.ts's host_permissions, so no server-side CORS changes are
// needed for this to work against either target.
const API_BASE_URL = "https://captioncraft.xyz";
// For local development against `npm run dev` in the main app, swap the
// line above for:
// const API_BASE_URL = "http://localhost:3000";

export type Variation = { text: string; hashtags: string[] };

export type Generation = {
  id: string;
  tone: string;
  postType: string | null;
  variations: Variation[];
  selectedVariation: number | null;
  createdAt: string;
};

export class ApiError extends Error {}

export async function fetchGenerations(token: string): Promise<Generation[]> {
  const res = await fetch(`${API_BASE_URL}/api/extension/generations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error || "Couldn't load your posts.");
  }

  const data = await res.json();
  return data.generations as Generation[];
}

// `connect=1` tells the settings page to auto-connect on load instead of
// waiting for a second click on "Connect extension" — carries the user's
// intent (expressed by clicking this link) through a login redirect if
// they're not signed in yet, so signing in and connecting the extension
// happen as one continuous flow instead of two separate steps.
export function tokenSettingsUrl(): string {
  return `${API_BASE_URL}/app/extension?connect=1`;
}

export type TelemetryReason = "no-compose-box" | "no-content-script";
export type TelemetrySurface = "feed" | "compose" | "messaging" | "profile-post" | "other";

// A coarse category derived from the LinkedIn tab's URL path — never the
// raw URL itself, which could identify a specific post. Used only to tell
// apart, in aggregate, which part of LinkedIn a compose-box failure
// happened on (e.g. "breakage concentrated in messaging" is useful;
// "user X was on this exact post" is not something this needs to know).
export function classifySurface(url: string): TelemetrySurface {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return "other";
  }
  if (path.startsWith("/messaging")) return "messaging";
  if (path.startsWith("/sharing/compose")) return "compose";
  if (path.startsWith("/feed")) return "feed";
  if (path.startsWith("/posts/") || path.startsWith("/in/")) return "profile-post";
  return "other";
}

// Anonymous, best-effort breakage signal — see
// supabase/migrations/0014_extension_telemetry.sql for exactly what this
// does and doesn't collect. Fire-and-forget: a telemetry failure must
// never surface to the user or affect the real Insert-failure UI they
// already see, so errors are swallowed here rather than propagated.
export function reportComposeBoxTelemetry(reason: TelemetryReason, surface: TelemetrySurface): void {
  fetch(`${API_BASE_URL}/api/extension/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason,
      surface,
      extensionVersion: browser.runtime.getManifest().version,
    }),
  }).catch(() => {});
}
