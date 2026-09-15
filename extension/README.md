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

## Getting a token

The extension authenticates with a personal access token (not a shared
session cookie) — generate one at `/app/extension` on the web app while
signed in, then paste it into the extension's popup. See
`app/lib/extension-auth.ts` in the repo root for how these are issued
and verified.

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
- No `background.ts` — the popup calls the API and messages the content
  script directly; there was no need for a persistent service worker.
