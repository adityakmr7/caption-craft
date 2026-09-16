# CaptionCraft for LinkedIn

A Chrome extension "smart paste" helper: insert a post you generated on
[captioncraft.xyz](https://captioncraft.xyz) into LinkedIn's compose box
without switching tabs. It never posts on your behalf — you still review
and click Post yourself. See `docs/PRD.md` and `TODO.md` in the repo root
for the product context.

Built with [WXT](https://wxt.dev) + React + TypeScript.

## Develop

```bash
npm install
npm run dev       # loads an auto-reloading unpacked extension via web-ext
```

To point the popup at a local `npm run dev` of the main Next.js app
instead of production, edit the `API_BASE_URL` constant in
`entrypoints/popup/api.ts`.

## Build

```bash
npm run build      # outputs .output/chrome-mv3/
npm run zip         # zips it for a Chrome Web Store upload
```

## Load unpacked (manual testing)

1. `npm run build`
2. Chrome → `chrome://extensions` → enable Developer mode → **Load unpacked**
3. Select `.output/chrome-mv3/`

## Connecting an account

The extension authenticates with a personal access token (not a shared
session cookie) — see `app/lib/extension-auth.ts` in the repo root for
how these are issued and verified. Two ways to connect:

1. **One click** (default): in the popup, click "Connect account" — it
   opens `/app/extension` on the web app. Click "Connect extension"
   there and the token is handed to the extension automatically via a
   `window.postMessage` handshake with the connect content script (see
   `entrypoints/connect.content.ts`). No copying, no pasting.
2. **Manual paste** (fallback, for when the extension isn't detected —
   not installed yet, wrong browser/profile, or the content script
   hasn't loaded): generate a token on the same settings page and paste
   it into the popup's "Paste a token manually instead" field.

## Architecture notes

- `entrypoints/popup/` — the toolbar popup UI (React). Fetches recent
  generations from `/api/extension/generations` and sends the chosen
  one to the active tab's content script.
- `entrypoints/content.ts` — runs only on `*.linkedin.com`. Listens for
  a message from the popup and inserts text into whichever LinkedIn
  compose box (post/comment/message — all built on Quill) is focused,
  or the largest visible one if none is. This is inherently best-effort
  against LinkedIn's undocumented, changeable DOM — see the comments in
  that file for the exact heuristic and why `execCommand("insertText")`
  is used instead of directly mutating the DOM.
- `entrypoints/connect.content.ts` — runs only on `/app/extension*` on
  captioncraft.xyz (and localhost, for dev). Implements the one-click
  connect handshake: receives a token via `window.postMessage` from the
  settings page, validates its origin/shape, stores it, and posts back
  an acknowledgment. Never runs on LinkedIn or anywhere else.
- `utils/storage.ts` — shared `chrome.storage.local` helpers for the
  extension's token, used by both the popup and the connect content
  script.
- No `background.ts` — the popup calls the API and messages the content
  script directly; there was no need for a persistent service worker.
