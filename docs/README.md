# Caption Craft — Planning Docs

Reference documents from the pre-build planning pass on the browser video editor and its React Native / Expo Android companion. Consolidated 18 Aug 2026.

**Core bet:** process video on the user's own device wherever possible (WebCodecs in the browser, whisper.cpp on-device on Android), and only call a server for the one thing that genuinely needs it — AI transcription, and later AI voice/script generation. That single decision is what keeps the whole product runnable on free-tier infrastructure.

## Contents

1. [Feasibility & Cost](./01-feasibility-and-cost.md) — is it buildable cheaply, and how, on web and Android
2. [Competitive Landscape](./02-competitive-landscape.md) — CueEditio, VEED, Submagic: what each actually does and where the openings are
3. [Caption Style System](./03-caption-style-system.md) — the v1 style catalog and the engine behind it
4. [Editor UX](./04-editor-ux.md) — the transcript-based editing model, for web and mobile

## Decisions locked so far

| Decision | Choice | Why |
|---|---|---|
| Editing model | Full text-based editing | Deleting text in the transcript cuts the matching clip, like Descript/Submagic — the most-praised UX in this category. |
| Track scope (v1) | Single video + audio track | Keeps the ripple-cut model simple; B-roll/music layering deferred to v2. |
| Mobile parity | Same transcript-editing model | One mental model across web and Android, adapted for touch rather than replaced. |
| AI cleanup (filler/silence) | Suggest, user approves | Shown as struck-through suggestions in the transcript; nothing is auto-cut without review. |
| Style scope | One style per project | Matches how people actually use Submagic/CapCut; keeps the style picker and data model simple. |
| Jump cuts | Hard cut + short audio crossfade | No visual transition by default; a ~30–80ms crossfade avoids an audible click at the seam. |

## Open items (not blocking, not decided yet)

- Multi-select across non-contiguous ranges (needed anyway for "accept all" AI suggestions).
- Style-picker / preset gallery UX — how users browse and preview the six v1 styles.
- Manual word-boundary adjustment — whether v1 trusts ASR timing as-is or allows dragging a word's start/end.
- Multi-track (B-roll, music, overlay text) — explicitly deferred out of v1.
- Shared caption/edit schema between web and mobile, so a project could move between platforms.

## A shareable version

This same content also exists as a designed, single-page reference: [Caption Craft Playbook](https://claude.ai/code/artifact/afd9b099-380f-4cbd-a708-a29bf5cf9af4) (private artifact — share from its page menu if needed).
