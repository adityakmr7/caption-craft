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
