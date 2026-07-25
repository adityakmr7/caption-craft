# CaptionCraft — Roadmap

## Phase 0 — Validation (current phase)

Goal: prove demand before writing the video pipeline. See [PRD.md Section 7](./PRD.md#7-validation-plan-do-this-before-writing-product-code) for the waitlist/pre-sale targets that gate Phase 1.

| Task | Status |
|---|---|
| Landing page (dark, glass-morphism, full spec) | ✅ done |
| Waitlist capture → Supabase | ✅ done |
| Domain purchase + deploy | ✅ done |
| 30-day content calendar execution (Twitter/Reddit/LinkedIn/IH) | 🔄 in progress — posting on Twitter |
| Concierge MVP: manually process 5 beta videos at $2 each | ⬜ recommended before Phase 1 |
| Hit 50+ waitlist AND 3+ pre-sales by end of Week 3 | ⬜ gate for Phase 1 |

**Do not start Phase 1 until the gate above is met.** This is the single most important sequencing decision in the original plan — building the pipeline before validating demand is the risk this roadmap exists to avoid.

## Phase 1 — Foundation (Week 1) — ✅ done

- ✅ Auth provider decided: Supabase Auth (see [ARCHITECTURE.md Section 4](./ARCHITECTURE.md#4-auth)) — sign-up/sign-in pages, session middleware (`proxy.ts`), protected `/dashboard`
- ✅ `users`, `subscriptions`, `credit_transactions` tables live (`supabase/schema.sql`, applied directly via `psql`)
- ✅ Signup → 20 free credits grant, via a Postgres trigger on `auth.users` insert (`handle_new_user`), verified end-to-end
- Note: `subscriptions.provider_subscription_id` is deliberately provider-agnostic (not `stripe_subscription_id`) — payment provider (Stripe vs. Paddle) is still undecided, see open questions in [PRD.md](./PRD.md#10-open-questions)

## Phase 2 — Upload & storage (Week 2)

- Video upload UI (drag-drop, up to 100MB, MP4/MOV/WebM validation)
- Cloudflare R2 bucket + upload API route
- `videos` table + status tracking (pending/processing/completed/failed)

## Phase 3-4 — Transcription + video processing (Weeks 3-4) — ✅ built and verified end-to-end

Built together rather than sequentially - the two are one pipeline (`POST /api/videos`).

**Full pipeline confirmed working live (2026-07-25):** a real narrated video, through a real authenticated session, produced a real captioned output in 10.2 seconds. Verified, not assumed: `videos.status = completed`, transcript text and word timings in `captions`/`words` matched the actual narration, credits deducted 20 → 19 with exactly one `credit_transactions` row, and the output video (1080x1920, downloaded and frame-checked) shows the correct word burned in at the correct moment in the Bold style.

- ✅ Whisper integration via Groq's OpenAI-compatible endpoint (`app/lib/whisper.ts`) - **verified with a real call**, real word-level timestamps back. See [ARCHITECTURE.md Section 10.4](./ARCHITECTURE.md#104-transcription-provider-openai--groq-2026-07-25) for why Groq over OpenAI.
- ✅ `videos`, `captions`, `words` tables live, populated from transcription output on a successful run
- ✅ 6 caption styles shipped: Bold, Neon, Karaoke (word-by-word, one word at a time, centered) and Retro, Cinematic, Minimal (phrase-grouped, bottom-third) - `app/lib/captions/styles.ts`
- ✅ Caption burn-in engine, **real end-to-end tested locally** on all 6 styles with a real video - visually verified, not just "compiles." One correction from the plan: not FFmpeg `drawtext` - the local FFmpeg build had no `libfreetype`, so text renders via `@napi-rs/canvas` to PNG, composited with FFmpeg's `overlay` filter instead. This is arguably better (real glow/shadow effects, no font-availability risk on the deploy target) and doesn't depend on how the production FFmpeg binary happens to be built.
- ✅ Output validated as 9:16 (1080x1920, confirmed via `ffprobe` on real output)
- ✅ Client-side audio extraction via `@ffmpeg/ffmpeg` (ffmpeg.wasm), **real end-to-end tested in-browser** (not just imported) - works through Next.js's actual bundle; a naive CDN-import test hits a same-origin Worker restriction that the real bundled path doesn't
- ✅ Video upload UI + style picker wired into `/dashboard` (`app/components/dashboard/VideoUpload.tsx`)
- ✅ Atomic credit deduction (`deduct_credit()` DB function) + full refund-on-failure path, tested for real (confirmed credits and the `credit_transactions` audit trail stay correct through a failed processing run)
- ✅ **Security fix caught while building this**: Phase 1's `users` RLS policy allowed a signed-in user to update *any* column on their own row directly from the client, including `credits`. Removed - `public.users` now has no client-side update path at all; `credits`/`plan` only change server-side.
- ✅ R2 storage - **verified with real uploads/downloads** plus a real public URL fetch (200, content matched) before the full pipeline run
- **HyperFrames was evaluated as an alternative rendering engine and shelved for now** (richer caption styles, but its matting-based "embed" look measured ~13x realtime — too slow to ship as-is). Full writeup and the workaround ideas to try before revisiting: [ARCHITECTURE.md Section 10](./ARCHITECTURE.md#10-caption-rendering-engine--hyperframes-evaluated-shelved-for-now-2026-07-24).
- **Known constraint, not yet solved**: processing currently runs synchronously inside the API request (no queue - Inngest is Phase 5 below). Fine for local dev and short clips; will hit Vercel's serverless execution limits in production before Phase 5 lands.

## Phase 5 — Async processing (Week 5)

- Inngest queue: transcribe → format → burn-in → upload → notify, with retries
- Move the upload API off the request/response cycle — uploads should return immediately and process in the background

## Phase 6 — Payments (Week 6)

- Stripe products for Starter/Pro/Business
- Checkout + customer portal
- Webhook handler updating `subscriptions` + granting monthly credits
- Atomic credit deduction on video processing (race-condition safe)

## Phase 7 — Dashboard (Week 7)

- Video gallery with status
- Credit balance + usage history (`credit_transactions`)
- Download / re-download processed videos

## Phase 8 — Hardening & launch (Week 8)

- Error handling + user-facing failure states (a failed Whisper call or FFmpeg job shouldn't silently eat a credit)
- Resend transactional emails (processing complete, payment failed, etc.)
- Sentry + PostHog wired in
- Public launch

## Restyle without re-transcribing — ✅ built and verified (2026-07-25)

Not an original roadmap phase — built in response to a competitor pattern (whitestair.com: caption with a default style immediately, let the user browse other templates afterward) that the user asked to replicate. Feasible cheaply specifically because transcription and rendering were already separate steps.

- ✅ `POST /api/videos/[id]/restyle` — re-runs `burnInCaptions()` against the video's already-stored transcript (`captions`/`words`) and a new style. No Groq call, no credit charge.
- ✅ Dashboard: after a video completes, the style picker reappears below the result — clicking a different style calls restyle in place and swaps the shown/downloadable video.
- ✅ **Verified live, not assumed:** uploaded with Bold, confirmed 19 credits and one `-1 video_processed` transaction; called restyle to Neon, confirmed **19 credits unchanged, zero new transactions, `videos.style` updated to `neon`**, and downloaded the actual output to confirm the pink glow Neon look rendered correctly from the same transcript. Took 8.8s (all render, no transcription call) vs. 10.2s for the original full upload.
- Cache-busting: the returned/stored `processed_url` gets a `?t=<timestamp>` query param, since the R2 object key is reused (overwritten) per restyle rather than versioned - avoids serving a stale cached copy after switching styles.

---

Each phase assumes 4–6 hrs/day, solo developer, per the original estimate. Phase durations are a planning input, not a commitment — Phase 0's outcome (what beta users actually complain about) should be allowed to reorder Phases 2–4 if it turns out styling matters more than upload UX, or vice versa.
