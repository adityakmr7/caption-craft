// The extension's own personal access token, stored locally on this
// device only — never synced, never sent anywhere but the CaptionCraft
// API. See app/lib/extension-auth.ts on the web app side. Shared between
// the side panel (reads it) and the connect content script (writes it via
// the auto-connect handshake — see connect.content.ts).
export const TOKEN_STORAGE_KEY = "captioncraft_token";

export async function getStoredToken(): Promise<string | null> {
  const result = await browser.storage.local.get(TOKEN_STORAGE_KEY);
  return (result[TOKEN_STORAGE_KEY] as string | undefined) ?? null;
}

export async function setStoredToken(token: string): Promise<void> {
  await browser.storage.local.set({ [TOKEN_STORAGE_KEY]: token });
}

export async function clearStoredToken(): Promise<void> {
  await browser.storage.local.remove(TOKEN_STORAGE_KEY);
}
