// Auto-connect handshake: runs only on the CaptionCraft settings page
// (never on LinkedIn — see wxt.config.ts's host_permissions and this
// file's own `matches` below) so a user can connect the extension with
// one click on the website instead of manually copying and pasting a
// token. See app/app/extension/extension-tokens.tsx for the page side
// of this handshake.
//
// Deliberately uses window.postMessage rather than externally_connectable
// (the other standard way a webpage can talk to an extension) — that
// requires the page to know the extension's ID in advance, which is
// stable for a Chrome Web Store listing but not for a locally loaded
// unpacked extension (a fresh random ID on every reload unless a fixed
// manifest key is set up). postMessage needs no such coordination: this
// script already runs in the page via a normal content-script match,
// so it can listen on the same `window` the page posts to.

const TOKEN_KEY = "captioncraft_token";
const MESSAGE_SOURCE_WEB = "captioncraft-web";
const MESSAGE_SOURCE_EXTENSION = "captioncraft-extension";

interface ConnectTokenMessage {
  source: typeof MESSAGE_SOURCE_WEB;
  type: "CAPTIONCRAFT_CONNECT_TOKEN";
  token: string;
}

export default defineContentScript({
  matches: ["https://captioncraft.xyz/app/extension*", "http://localhost:3000/app/extension*"],
  main() {
    window.addEventListener("message", (event: MessageEvent) => {
      // Only accept messages from this exact page's own window, on its
      // own origin — never from an embedded frame or a different tab,
      // and never trust the shape without checking it first.
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      if (!isConnectTokenMessage(event.data)) return;

      browser.storage.local.set({ [TOKEN_KEY]: event.data.token }).then(() => {
        window.postMessage(
          { source: MESSAGE_SOURCE_EXTENSION, type: "CAPTIONCRAFT_CONNECTED" },
          window.location.origin
        );
      });
    });
  },
});

function isConnectTokenMessage(data: unknown): data is ConnectTokenMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === MESSAGE_SOURCE_WEB &&
    (data as { type?: unknown }).type === "CAPTIONCRAFT_CONNECT_TOKEN" &&
    typeof (data as { token?: unknown }).token === "string" &&
    (data as { token: string }).token.startsWith("cc_")
  );
}
