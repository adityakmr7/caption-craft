# Editor UX — the transcript is the editor

Six decisions were made for this spec (see the log in [README.md](./README.md)): full text-based editing, single track for v1, same model on mobile, AI cleanup is suggest-then-approve, one style per project, and hard cuts get an automatic short audio crossfade.

## Core interaction model

The transcript panel is the primary editing surface — not a secondary tool next to a timeline.

```
┌─────────────────────────────┬───────────────┐
│                               │   Style        │
│      Video Preview            │   Picker       │
│      (captions burned in      │   (single      │
│       live, current style)    │    active      │
│                               │    style)      │
├───────────────────────────────┴───────────────┤
│  Transcript (scrollable, word-timed)           │
│  "So today I want to ~~um~~ show you how to    │
│   set this ~~[2.1s silence]~~ up properly."    │
└─────────────────────────────────────────────────┘
```

A thin timeline strip stays visible below the transcript (collapsed by default) for global scrubbing/zoom — orientation only, never required for editing. Power users can expand it.

## Editing interactions

- **Click** a word → seeks the preview to that word's timestamp.
- **Select a range of words** (click-drag, or shift-click) → inline toolbar: `Delete` / `Cancel`.
- **Delete** → selected words visually collapse (strike-through → removed), video ripple-cuts: everything after shifts left to close the gap, with a ~30–80ms audio crossfade auto-applied at the seam (no visual transition by default).
- **Retype/edit text in place** → only changes the caption label + what's burned in; does **not** touch the cut. This is the mechanism for separating "fix a misheard word" from "cut this out" — typing over a word only relabels it; select + delete is what triggers a ripple-cut.
- **Undo/redo** is one flat linear history (Cmd/Ctrl+Z) shared by both text edits and cuts.

## AI cleanup suggestions (filler words / silence)

Runs automatically right after transcription, presented *inside* the transcript rather than a separate panel:

- Filler words and silence gaps appear **pre-struck-through with a subtle dashed underline** — visually distinct from a user's own manual deletions (different color/weight, `AI suggestion` affordance).
- Toolbar above the transcript: **"Accept all suggestions"** / **"Review one by one"**. Accepting collapses it into a real cut immediately (same ripple + crossfade as manual delete); rejecting clears the strikethrough, leaves the word untouched.
- Nothing is auto-applied without this pass.

## Style application

Single style picker, always visible, one active style per project — not per-line. Switching styles re-renders the live preview instantly (same canvas renderer from the [style system](./03-caption-style-system.md), fed a different `StyleConfig`). No per-line style assignment UI in v1.

## Mobile (Expo) adaptation

Same model, adapted for touch rather than replaced:

- Preview on top (larger, primary feedback loop on a small screen), transcript below, style picker as a bottom-sheet.
- Word selection via **tap-and-hold on the first word → drag to extend** (the native text-selection-handle pattern from Notes/Messages), not click-drag.
- **Swipe-left-to-delete** on a line as a fast secondary path — precise multi-word drag-select is harder on a phone.
- AI-suggested cuts get **large tap targets** (chip-style `"um ✕"` inline) rather than tiny strikethrough text — small dashed underlines that work on a mouse are too fiddly for a fingertip.

## Data model

Keep an explicit **edit-decision-list**-style structure rather than mutating the source media:

```
originalTimeline: Segment[]                          // untouched, from the raw recording
edits: { type: 'cut' | 'text-correction', range, ... }[]
```

The renderer always computes the "kept" timeline by replaying `edits` over `originalTimeline`. This is what makes undo trivial, keeps re-transcription non-destructive, and is the same pattern Descript/Submagic rely on for their transcript-editing UX to feel instant.

## Remaining open item

Multi-select across non-contiguous ranges (e.g. delete two separate filler words in one action) — worth supporting from day one since "Accept all suggestions" needs it anyway, likely free once single-range delete works. Not blocking, but worth confirming before build.
