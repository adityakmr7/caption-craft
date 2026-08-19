# Feasibility & Cost

Can Caption Craft be built cheaply on web and Android, and how.

## Bottom line

Both platforms are technically feasible at near-zero marginal cost: WebCodecs for client-side rendering in the browser, whisper.cpp for on-device captions on Android, and a generous free tier (Groq Whisper) for the web app's transcription calls. The engineering cost is real — native prebuild on mobile, WebCodecs plumbing on web — but the dollar cost is not.

## Web (Next.js, already scaffolded)

The enabling technology is the **WebCodecs API** — hardware-accelerated, frame-level encode/decode, now at roughly 95% browser coverage ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)). Paired with `OffscreenCanvas` and a Web Worker, trim, crop, overlay, and re-encode can all happen entirely client-side. No video byte ever needs to touch a server for basic editing and export.

Captions need speech-to-text, which is the one place a network call earns its cost:

| Option | Cost | Notes |
|---|---|---|
| In-browser Whisper (WASM/WebGPU) | $0 | Fully private, no upload; slower, needs a model download (~40–150MB). |
| **Groq Whisper API** | Free up to ~2,000 req / ~8hr audio per day, then $0.04–$0.11/hr | Generous free tier, word-level timestamps supported — the MVP default. |
| OpenAI Whisper / gpt-4o-mini-transcribe | $0.003–$0.006/min (~$0.18–$0.36/hr) | Fallback once Groq's free quota is outgrown. |
| Web Speech API | $0 | Chrome-only, live-mic only — not viable for file transcription with reliable timestamps. |

Word-level timestamps — the hard requirement for word-by-word animated captions — are available via `response_format: verbose_json` + `timestamp_granularities: ["word"]` on both Groq and OpenAI ([Groq docs](https://console.groq.com/docs/speech-to-text)).

Hosting stays on **Vercel's free Hobby tier**, since rendering never runs through a serverless function — the exact workload (video transcoding) that Hobby's 300s timeout can't handle anyway. If project save/share is added, Supabase Storage's free tier (1GB) is already wired into the stack.

**What not to do (cost trap):** don't reach for a managed rendering API like Shotstack ($0.20–0.30/min) or Remotion Cloud ($100/mo license) unless programmatic/batch rendering is specifically needed. For a user-facing editor where the user's own machine does the work, that's paying for compute that isn't needed.

## Android (React Native + Expo)

One important piece of drift from general RN knowledge: **`react-native-ffmpeg` / `FFmpegKit` is dead** — binaries were pulled from Maven Central, CocoaPods, and npm in April 2025, no more security patches ([source](https://www.itpathsolutions.com/ffmpegkit-shutdown-what-to-do-next)). Plan around it explicitly rather than reaching for it by habit.

- **Editing (trim/overlay/export):** requires leaving the Expo Go sandbox for a prebuild/custom dev client (still fully Expo-managed, just not Expo Go). Options, cheapest first:
  - `react-native-video-processing` for basic trim/compress/watermark — no full ffmpeg binary needed.
  - Bundle FFmpeg via NDK (Android) directly — free, more setup, full control. `FFmpegKitNext` (community continuation) is the closest drop-in replacement for the old API.
  - Cloud transcode fallback only for edge cases the on-device path can't handle.
- **Captions:** [`whisper.rn`](https://github.com/mybigday/whisper.rn) (a whisper.cpp binding) runs transcription fully **on-device — offline, private, $0 marginal cost** — with word/token-level timestamps for animated captions. Needs prebuild too.
- **Playback:** `expo-video`, actively maintained.

With on-device whisper.cpp + on-device/NDK ffmpeg, the mobile app can also run at **$0 marginal cost per user** — no per-minute transcription bill, no server transcoding bill. The trade-off is engineering time (native prebuild, binary size, testing across device tiers), not dollars.

## Overall cost comparison

| Strategy | Monthly cost | Effort | Fit |
|---|---|---|---|
| **Fully client-side** (WebCodecs + Groq/whisper.cpp) | **$0–$5** | Higher (native prebuild, WebCodecs) | **Recommended** — cost doesn't grow with users |
| Hybrid: client-side editing + cloud STT only | $0–$20 | Medium | Reasonable middle ground |
| Server-side / managed (Shotstack, Remotion Cloud, cloud transcode) | $40–$300+ | Lowest dev effort | Only if batch/programmatic rendering is needed |

## Phased roadmap

1. **Web MVP** (2–4 weeks): upload → WebCodecs-based trim/crop → Groq free-tier captions → burn-in captions → client-side export to MP4. Zero infra cost beyond existing Vercel/Supabase free tiers.
2. **Web v1**: caption style presets (see [03-caption-style-system.md](./03-caption-style-system.md)), multi-track text/overlay, project save via Supabase.
3. **Mobile MVP** (Expo prebuild): capture/import video, on-device whisper.rn captions, basic trim + text overlay via native module, export/share.
4. **Mobile v1**: caption style parity with web, shared caption/edit schema across platforms.
5. Only introduce a paid server-rendering path later, and only for a specific need (e.g. "render 4K in the cloud" as a premium feature) — never as the default flow.

## Risks to plan for, not blockers

- Safari's WebCodecs/WebGPU support lags Chrome slightly — test early, keep a ffmpeg.wasm fallback path for unsupported browsers/operations.
- whisper.cpp model size (tiny/base ~40–150MB) affects app size and first-run download — pick the smallest model that gives acceptable accuracy.
- Low-end Android devices will be slow at on-device Whisper/encode — set expectations (progress UI, a quality/speed toggle) rather than fighting it.
- Prebuild/custom dev client means losing Expo Go convenience for testing — plan CI (EAS Build) time into the workflow.
