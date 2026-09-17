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

To point the side panel at a local `npm run dev` of the main Next.js app
instead of production, edit the `API_BASE_URL` constant in
`entrypoints/sidepanel/api.ts`.

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

1. **One click** (default): in the side panel, click "Connect account" —
   it opens `/app/extension` on the web app. Click "Connect extension"
   there and the token is handed to the extension automatically via a
   `window.postMessage` handshake with the connect content script (see
   `entrypoints/connect.content.ts`). No copying, no pasting.
2. **Manual paste** (fallback, for when the extension isn't detected —
   not installed yet, wrong browser/profile, or the content script
   hasn't loaded): generate a token on the same settings page and paste
   it into the side panel's "Paste a token manually instead" field.

## Architecture notes

- `entrypoints/sidepanel/` — the main UI (React), opened via Chrome's
  side panel rather than a toolbar popup — see "Why a side panel, not a
  popup" below. Fetches recent generations from
  `/api/extension/generations` and sends the chosen one to the active
  tab's content script.
- `entrypoints/background.ts` — the only thing it does is call
  `browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`
  so clicking the toolbar icon opens the side panel. No other
  background logic exists; the side panel calls the API and messages
  the content script directly.
- `entrypoints/content.ts` — runs only on `*.linkedin.com`. Listens for
  a message from the side panel and inserts text into whichever
  LinkedIn compose box is focused, or the largest visible one if none
  is. LinkedIn does not use one consistent editor across surfaces (the
  post composer is Tiptap/ProseMirror, the messaging box has its own
  custom implementation) so this targets the standard ARIA textbox
  contract (`[contenteditable="true"][role="textbox"]`) rather than any
  one framework's CSS class — inherently best-effort against
  LinkedIn's undocumented, changeable DOM either way. See the comments
  in that file for why `execCommand("insertText")` is used instead of
  directly mutating the DOM.
- `entrypoints/connect.content.ts` — runs only on `/app/extension*` on
  captioncraft.xyz (and localhost, for dev). Implements the one-click
  connect handshake: receives a token via `window.postMessage` from the
  settings page, validates its origin/shape, stores it, and posts back
  an acknowledgment. Never runs on LinkedIn or anywhere else.
- `utils/storage.ts` — shared `chrome.storage.local` helpers for the
  extension's token, used by both the side panel and the connect
  content script.

### Breakage telemetry

`content.ts` answers a `CAPTIONCRAFT_PING` message with whether a
compose box currently exists (`hasComposeBox`), which the side panel
polls every 2s to show a live status banner *before* the user clicks
Insert. Separately, when an actual Insert click fails, the side panel
reports that anonymously to `POST /api/extension/telemetry` — see
`classifySurface`/`reportComposeBoxTelemetry` in `entrypoints/sidepanel/api.ts`
and `supabase/migrations/0014_extension_telemetry.sql`. This exists
because the selector has already broken once from a LinkedIn DOM change
(Quill → Tiptap/ProseMirror) and the team only found out from a user
report — the goal is to find out from the data instead. The payload is
deliberately minimal: a `reason` enum, a coarse `surface` category
derived client-side from the tab's URL *path* (never the raw URL), and
the extension version. No user id, no LinkedIn page content, nothing
that identifies a person or what they were posting about. Fired only
from a real Insert attempt, never from the passive poll (which would
otherwise fire constantly during ordinary idle browsing).

### Why a side panel, not a popup

A `default_popup` closes the instant it loses focus — including when
you click into the page to focus LinkedIn's compose box, which is
exactly the moment this extension needs to still be usable. Chrome's
side panel (`chrome.sidePanel`, Chrome 114+) stays open alongside the
page instead, so you can have LinkedIn's compose box open, click Insert
in CaptionCraft, and not lose either one. There is no `action.default_popup`
in the manifest at all — `entrypoints/background.ts`'s
`setPanelBehavior({ openPanelOnActionClick: true })` is what makes the
toolbar icon open the side panel.
