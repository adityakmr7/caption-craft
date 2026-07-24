# CaptionCraft — Product Requirements Document

Status: **Validation stage.** Landing page and waitlist capture are live; the video-processing product described below is not yet built. See [ROADMAP.md](./ROADMAP.md) for what's shipped vs. planned.

## 1. Problem

Short-form creators (TikTok, Reels, Shorts) know captions materially increase watch time and reach, but adding them well requires either manual editing (slow, requires skill) or expensive all-in-one video generators (overkill, costly). There's no fast, cheap, single-purpose tool that just does captions really well.

## 2. Product

CaptionCraft is a single-purpose web app: upload a short-form video, get it back with AI-transcribed, styled, animated captions burned in, in under 90 seconds. No editing skills required.

**Explicit non-goal:** CaptionCraft is not a video generator, not a full editing suite, and not trying to compete with Submagic/Crayo on breadth. It competes on being faster, cheaper, and more focused than either.

## 3. Target user

- Solo short-form creators posting to TikTok/Reels/Shorts who currently caption manually or skip captions entirely.
- Small agencies/editors handling multiple client accounts (bulk processing is for them specifically).
- Not targeting: long-form YouTube editors, podcasters, enterprise video teams.

## 4. Core user flow (MVP)

1. User uploads a video (up to 100MB; MP4/MOV/WebM).
2. User picks a caption style (Bold, Neon, Retro, Cinematic, + 2 more to reach "6 viral styles").
3. System transcribes audio, times words, applies the chosen style, burns captions into the video.
4. User downloads the result (9:16 ready) or gets an email when it's done.

Processing target: 30–90 seconds for a 60-second video.

## 5. Feature scope

### In scope for v1
- Video upload (single + bulk queueing)
- AI transcription (Whisper-class accuracy, accents/slang tolerant)
- 6 caption styles, word-by-word animation option
- Style preview before processing
- Credit-based usage (see pricing) with a free tier (20 credits)
- Email notification on completion
- Account + billing (subscription management)

### Explicitly out of scope for v1
- Team seats / multi-user workspaces (Business plan promises this — treat as v1.1, not launch-blocking)
- Public API access (also a Business-plan line item — defer)
- White-label export
- Manual timeline editing of captions (auto-only for v1; if users ask for manual nudging of word timing, that's a v2 candidate)
- Any platform other than TikTok/Reels/Shorts aspect ratio (9:16 only — no 16:9/1:1 in v1)

## 6. Pricing (validation-stage pricing, subject to change based on Week 1–4 signal)

| Plan | Price | Credits | Notes |
|---|---|---|---|
| Free | $0 | 20 lifetime | Validation/acquisition tier |
| Starter | $15/mo | 100 | 3 styles, 720p |
| Pro | $29/mo | 500 | All styles, 1080p, word-by-word, bulk, priority — **primary plan to design around** |
| Business | $79/mo | 2,000 | Team seats, API, white-label — v1.1, don't block launch on these |

1 credit ≈ 1 video processed (exact credit-per-minute formula is a build-time decision, see [ARCHITECTURE.md](./ARCHITECTURE.md#credit-system)).

## 7. Validation plan (do this before writing product code)

CaptionCraft's build cost is intentionally deferred behind a validation gate — the whole point of the original plan was "don't write the video pipeline until demand is proven."

| Week | Waitlist target | Conversations | Pre-sales |
|---|---|---|---|
| 1 | 25+ | 10+ | 0 |
| 2 | 75+ | 25+ | 1+ |
| 3 | 150+ | 40+ | 2+ |
| 4 | 250+ | 60+ | 3+ |

**Green light to build the processing pipeline:** 50+ waitlist signups **and** 3+ pre-sales by end of Week 3.

**Concierge MVP (recommended before any code):** manually process videos for 5 beta users via Whisper + FFmpeg by hand, charge $2/video, deliver in 24h. This produces a product spec grounded in real usage, 5 testimonials, and first revenue — cheaper than building the wrong thing.

## 8. Current status vs. this PRD

What's actually shipped as of this doc:
- ✅ Landing page (dark, glass-morphism, all 10 sections per spec) — `app/components/CaptionCraftLanding.tsx`
- ✅ Waitlist capture wired to Supabase (`app/api/waitlist/route.ts`, `waitlist` table)
- ❌ Everything in Section 4 (upload, transcription, styling, burn-in, credits, billing) — not started, gated behind validation per Section 7

## 9. Success metrics (post-launch, once the pipeline exists)

- Activation: % of signups who process at least 1 video within 7 days
- Retention: % of Pro subscribers still active at day 30
- Cost discipline: actual Whisper spend per active user stays near the modeled $2.40/mo for Pro (see [COST-ANALYSIS.md](./COST-ANALYSIS.md)) — if real usage tracks closer to the theoretical max ($6/mo), pricing needs revisiting before it erodes margin
- Margin: gross margin stays above 80% through Growth stage

## 10. Open questions

- Domain: `.xyz` (captioncraft.xyz) was the validation-stage call over `.io`, for cost and availability reasons. Revisit once the product is proven — a domain migration is cheap early, expensive after backlinks/brand accumulate.
- Auth provider: original plan specified Clerk. Since the waitlist already runs on Supabase, using **Supabase Auth** instead avoids a second vendor for a project this small — see [ARCHITECTURE.md](./ARCHITECTURE.md#auth) for the trade-off. Needs a decision before Week 1 of the build phase.
- Exact credit-to-minute conversion (flat 1 credit/video vs. per-minute) is unresolved — affects whether long videos are underpriced.
- **Caption rendering engine: hand-rolled FFmpeg vs. HyperFrames.** Under consideration: instead of hand-coding 6 FFmpeg drawtext styles, use HyperFrames (its `embedded-captions` catalog already has 32 named caption identities with animation built in — richer than the original plan) as the styling/rendering engine for Phase 3-4. Real upside on visual quality and build speed for that layer; unverified so far: per-video render cost and speed at SaaS volume, and whether the matting-based identities assume a clean single-subject talking-head shot (most but not all target content is). Needs a feasibility spike (render one real short-form video through it, time it, cost it) before committing — see [ARCHITECTURE.md Section 10](./ARCHITECTURE.md#10-caption-rendering-engine-open-question).
