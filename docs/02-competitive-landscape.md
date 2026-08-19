# Competitive Landscape

What CueEditio, VEED, and Submagic actually do — researched directly from their sites (Aug 2026).

## CueEditio — broad AI editor, hybrid rendering

[cueedit.io](https://www.cueedit.io/) is a solo-builder product (Sanskar Tiwari, ~2M+ users across other apps, ~$300K ARR): a full timeline editor plus an AI chat copilot ("Maya") that scripts, voices, finds footage, and cuts from a single prompt.

**What it actually does:**
- Multi-track timeline, text overlays/lower-thirds, effects (opacity/brightness/contrast/saturation/blur)
- Maya: natural-language edit commands — "add a voiceover to this," "add captions" — watches the video, writes a script, picks a voice, inserts it into the timeline
- Auto captions/subtitles: transcribe → timed captions, editable, bulk-add to timeline
- AI voiceover: 6 voices, 0.5x–2x speed, AI-written script matched to pacing
- Stock (Pexels) + Google Photos import, semantic search across an indexed video library
- 10+ templates (Reels, YouTube intros, testimonials, audiograms)
- "Recreate a reel" (coming soon): paste an IG/TikTok/YouTube link → AI breaks down storyline/pacing/transitions → matches your own footage to each beat → ready-to-post recreation

**Architecture (confirmed from their own FAQ and page source):**
- **Editing and export render client-side via ffmpeg.wasm** — footage never leaves the device for those steps. Their FAQ: *"Videos are rendered directly in your browser using FFmpeg... your footage never leaves your device during export."*
- Every AI feature (captions, voiceover, Maya's scene understanding, semantic search, reel-recreation) necessarily uploads media to a server — their FAQ continues: *"Uploaded media is stored securely on encrypted cloud storage."*
- Stack is Next.js on Vercel (Turbopack chunks, `_next/static`, Vercel deployment-ID query params) — same as this repo.

**Pricing:** freemium, INR-priced via Razorpay. Free / Pro (₹459/mo) / Business (₹1,299/mo). AI-metered features (subtitle minutes, voiceover minutes, Maya prompts, AI images) are gated by tier; **exports are unlimited on every tier**, because rendering costs them nothing.

## VEED — captions as one tool among twenty

[veed.io](https://www.veed.io/tools/add-subtitles-to-video) is a broad AI video platform: dubbing, avatars, background removal, eye-contact correction, and captions all sit side by side.

**Captions specifically:**
- Auto-subtitle: 99.9% accuracy claim, auto-flags low-confidence words/jargon/names for review
- Styling: fonts/colors + "dynamic" keyword-pop captions (keywords scale/pop as spoken) — one style option among many, not the core identity
- Translation to 125+ languages
- Export as burned-in video, or download separate **SRT/VTT/TXT** (paid plans)
- Explicit accessibility framing: *subtitles* = dialogue only; *captions* = dialogue + sound descriptors like `[music]`, `[laughter]`

**Pricing signal:** even the cheapest paid tier (~₹520/mo) includes **"Unlimited Auto Subtitles."** Their credit system is reserved for the expensive generative features (AI avatars, video/image generation, dubbing) — subtitles are treated as a cheap, near-free-to-them core feature, not a metered one. No "renders in your browser" claim anywhere — likely a cloud-processing platform given the breadth of AI features.

## Submagic — captions *are* the product

[submagic.co](https://www.submagic.co/) is narrowly built for short-form vertical video (TikTok/Reels/Shorts), at genuine scale (4M+ users).

**What makes it different:**
- **Text-based editing, not timeline editing** — "Delete a sentence from the transcript. The video cut happens automatically. No timeline, no rendering, no learning curve." (The Descript pattern: editing the transcript *is* editing the video.)
- **35+ animated caption presets** — word-by-word highlight/bounce/fade synced to speech, the "viral TikTok caption" look
- 99% accuracy, 123 languages, translation built in
- Brand kit: upload fonts/colors for a consistent look across renders
- Platform-aware export: safe-zone-aware crops for 9:16 (TikTok/Reels), 16:9 (YouTube), 1:1 (LinkedIn)
- Same captions-vs-subtitles distinction as VEED, framed for virality: *"Captions: burned in, built to hold attention"* vs *"Subtitles: a text track viewers control."*

**Pricing:** metered by videos/month + max duration per video (2 min → 30 min across tiers), plus AI credits for heavier features (hook titles, silence/filler removal, clean audio). Published **API pricing: $0.10–$0.15/min** — a useful real-world proxy for captioning-at-scale cost. Duration caps + "priority rendering" as a paid perk imply a server-side render queue, not local export.

## Side-by-side

| | VEED | Submagic | CueEditio |
|---|---|---|---|
| Product scope | Broad AI video platform | Captions/shorts-first | Broad AI editor |
| Caption UX | Timeline + style panel | **Transcript-based editing** | Timeline + Maya chat |
| Caption styles | Fonts/colors + keyword-pop | **35+ animated presets** | Preset styles |
| Rendering | Cloud (implied) | Cloud, duration-capped | **Client-side (ffmpeg.wasm)** |
| Subtitle monetization | Unlimited, even cheap tier | Metered by video count/length | Metered minutes/month |

## Strategic read for Caption Craft

1. **Transcription itself is not defensible** — every competitor treats it as commodity-cost, and VEED gives it away unlimited. The moat has to be in **style depth** (Submagic's 35+ presets is the bar) and/or **editing UX** (transcript-driven cutting beats timeline-scrubbing).
2. **Nobody else leans on "runs entirely in your browser, video never uploaded"** as a selling point except CueEditio partially — VEED and Submagic are both cloud-upload products. This is a real, currently-uncontested privacy angle for Caption Craft's client-side pipeline.
3. **Adopt the captions-vs-subtitles framing** — both competitors use it for SEO/education and it maps cleanly onto real features (burned-in styled captions vs. downloadable SRT/VTT) worth supporting either way.
4. **Submagic's 4M+ users on a captions-only wedge** is the strongest evidence that narrow-and-deep beats broad here — don't try to out-feature CueEditio, out-caption Submagic instead.
