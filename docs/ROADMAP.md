# CaptionCraft — Roadmap

## Phase 0 — Validation (current phase)

Goal: prove demand before writing the video pipeline. See [PRD.md Section 7](./PRD.md#7-validation-plan-do-this-before-writing-product-code) for the waitlist/pre-sale targets that gate Phase 1.

| Task | Status |
|---|---|
| Landing page (dark, glass-morphism, full spec) | ✅ done |
| Waitlist capture → Supabase | ✅ done |
| Domain purchase (captioncraft.xyz) | ⬜ user action, outside codebase |
| 30-day content calendar execution (Twitter/Reddit/LinkedIn/IH) | ⬜ user action, outside codebase |
| Concierge MVP: manually process 5 beta videos at $2 each | ⬜ recommended before Phase 1 |
| Hit 50+ waitlist AND 3+ pre-sales by end of Week 3 | ⬜ gate for Phase 1 |

**Do not start Phase 1 until the gate above is met.** This is the single most important sequencing decision in the original plan — building the pipeline before validating demand is the risk this roadmap exists to avoid.

## Phase 1 — Foundation (Week 1)

- Decide Auth provider (Supabase Auth vs. Clerk — see [ARCHITECTURE.md Section 4](./ARCHITECTURE.md#4-auth)) and implement sign-in/sign-up
- Create `users`, `subscriptions`, `credit_transactions` tables (SQL in [ARCHITECTURE.md Section 3](./ARCHITECTURE.md#3-database-schema))
- Wire signup → 20 free credits grant

## Phase 2 — Upload & storage (Week 2)

- Video upload UI (drag-drop, up to 100MB, MP4/MOV/WebM validation)
- Cloudflare R2 bucket + upload API route
- `videos` table + status tracking (pending/processing/completed/failed)

## Phase 3 — Transcription (Week 3)

- OpenAI Whisper integration
- `captions` + `words` tables populated from Whisper output
- Style picker UI (start with the 4 styles already designed in the landing page's Style Showcase: Bold, Neon, Retro, Cinematic — add 2 more to reach "6 viral styles")

## Phase 4 — Video processing (Week 4)

- FFmpeg WASM client-side audio extraction (send audio, not full video, to reduce upload size/cost)
- Server-side FFmpeg caption burn-in per style
- Output validated as 9:16

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

---

Each phase assumes 4–6 hrs/day, solo developer, per the original estimate. Phase durations are a planning input, not a commitment — Phase 0's outcome (what beta users actually complain about) should be allowed to reorder Phases 2–4 if it turns out styling matters more than upload UX, or vice versa.
