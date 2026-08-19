# Caption Style System (v1)

The v1 preset catalog and the rendering engine behind it.

## Foundation

Word-level timestamps — the one hard requirement for word-by-word animated captions — are available everywhere in the planned stack: Groq and OpenAI both return them via `response_format: verbose_json` + `timestamp_granularities: ["word"]`, and whisper.cpp/whisper.rn exposes the same at the token level on-device (see [01-feasibility-and-cost.md](./01-feasibility-and-cost.md)).

Every style is a renderer over one shared schema — build the schema once, styles are swappable render functions on top of it:

```
Word  { text, startMs, endMs, confidence }
Line  { words: Word[], startMs, endMs }   // grouped by line-break logic
Track { lines: Line[], lang, style: StyleConfig }
```

Build **one canvas renderer** that takes a `StyleConfig` object and interprets it per frame, rather than one component per style. That's what lets the catalog grow from 6 to 30 later without new rendering code — the same way Submagic's "35+ presets" is really one engine with many parameter sets.

## v1 catalog — six styles, not thirty-five

Quality over quantity for a v1: six sharp options beat thirty mediocre near-duplicates.

| Style | Look | Mechanics | Use case |
|---|---|---|---|
| **Classic Bar** | Clean white text, semi-transparent black bar, bottom-third | Line-level, no per-word animation, simple fade in/out | Safe default, accessibility/SRT-style, talking-head/interview content |
| **Karaoke Pop** (Hormozi-style) | Bold oversized text, one word "active" at a time in a highlight color/box, rest dimmed | Word-level: active word swaps color + scales 1.0→1.15 at its `startMs`, reverts at `endMs` | The most-copied short-form look — table stakes, must ship in v1 |
| **Bounce Emphasis** | Each word bounces in with a spring/overshoot as it's spoken | Word-level: scale 0→1.1→1.0, ease-out-back over ~150ms | High-energy content (comedy, hype, ads) |
| **Word Reveal** | Words appear one at a time, previous words stay visible (builds the full line) | Word-level: opacity/translateY reveal per word, no removal until line ends | Podcast clips, storytelling pacing |
| **Bold Outline** | Heavy stroke + drop shadow, no background box | Line-level, static, contrast-first | Busy/bright backgrounds where a bar would block the shot |
| **Minimal Fade** | Small, low-key, top or bottom, gentle crossfade between lines | Line-level, opacity only | Talking-head, B2B/corporate, users who find the loud styles too much |

## Style parameters (the engine, not the list)

Decompose every style above into one config shape so v2 growth is adding rows, not code:

- **Typography**: font family/weight, size (relative to frame height, not px — must scale across 9:16/1:1/16:9), letter-spacing, line-height, max lines on screen (2 is the norm)
- **Color**: base text color, active-word color, background/pill color + opacity, stroke color/width, shadow blur/offset
- **Position**: anchor (top/center/bottom) + safe-zone margin percentage
- **Animation**: type (`none | pop | bounce | reveal | fade`), duration, easing curve, trigger (`word | line`)
- **Background shape**: `none | bar | pill-per-word | box`

## Platform / aspect safe zones

Ship export presets, not just a free crop tool — small feature, removes real friction, matches Submagic's platform-aware exports:

| Preset | Aspect | Bottom safe margin | Reasoning |
|---|---|---|---|
| TikTok / Reels / Shorts | 9:16 | ~20% from bottom | Clears caption UI, like/comment buttons, username bar |
| YouTube | 16:9 | ~8% from bottom | Clears progress bar / end-screen elements |
| Feed / LinkedIn | 1:1 | ~10% from bottom | Clears feed UI overlap |

## Deliberately deferred (not v1)

- Auto-emoji insertion, sentiment-based keyword highlighting, AI B-roll — real v2/v3 differentiators, but each adds an LLM call per caption and isn't needed to be competitive on day one.
- 30+ presets — a bloated style picker with lookalikes hurts more than it helps.

## Implementation note

Write the renderer once against `(word, styleConfig, tMs) → draw instructions`, and run it in two contexts with zero duplicated logic:

1. **Live preview**: draw directly to a `<canvas>` overlay synced to the `<video>` element's `currentTime` — cheap, real-time, no encoding involved.
2. **Export/burn-in**: same renderer draws into an `OffscreenCanvas`, composited onto each decoded `VideoFrame` before re-encoding via WebCodecs.
