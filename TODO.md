# TODO

**Last updated:** 2026-09-15 (screenshot-confirmation step — live-verified)

Quick-glance status. For the full phased plan and reasoning see [docs/ROADMAP.md](./docs/ROADMAP.md); for the dated build log see [docs/CHANGELOG.md](./docs/CHANGELOG.md). Everything below is verified against the live app/production config as of this date, not just doc claims — a couple of items in ROADMAP.md's "Still open" list (Razorpay checkout, the firewall rule) are actually done and are marked shipped here.

**Live verification note (2026-09-13):** a full live pass with a fresh test signup caught a real bug the initial code review missed — `inferToneFromSamples`'s hype-detection regex carried a shared `/gi` flag, making its ALL-CAPS-word check case-*insensitive* and matching nearly every word as "hype" regardless of case. Confirmed via a test account pasting clearly casual samples that got classified as "Hype." Fixed, redeployed, and re-verified live (correct classification, and the warning banner correctly disappears when the selected tone now matches). This is the second time an actual browser run surfaced something code review alone didn't — treat "verified" claims as provisional until exercised with real, somewhat adversarial input, not just a clean build.

---

## ✅ Shipped (live in production)

**Core product**
- Landing page + waitlist capture (`app/api/waitlist`)
- Auth — Supabase email/password sign-up/sign-in
- Screenshot upload (drag-drop/paste/browse) → Gemini 2.5 Flash → 3 LinkedIn post variations + hashtags
- Post type templates (Milestone / Lesson / Contrarian / Data)
- Tone selector (Professional / Casual / Hype)
- Readability score + hook-quality feedback, static India posting-time tip
- LinkedIn-accurate post preview
- Post history — view, edit (persisted), delete, filter by what was actually used
- Free tier — **10 generations/month** (changed from 3 lifetime 2026-09-13), atomic row-locked enforcement with automatic monthly rollover, no separate reset job

**Billing**
- Razorpay subscription checkout (₹299/mo, ₹2,999/yr), cancel flow, webhook-driven status sync (`subscription.cancelled` → `billing_events` → `profiles` downgrade) — confirmed working end-to-end against a real test subscription

**Infra / security**
- Vercel Firewall rate limit on `POST /api/generate` (10 req/5min/IP) — published and enabled, not just staged
- RLS policies on all user data tables

**Design**
- Light theme, light as the unconditional default (not tied to OS `prefers-color-scheme`)
- Custom logo/brand mark, generated favicon + apple-icon from the same glyph

**Auth**
- Google OAuth button restored on `/login` (code side only — see Remaining below for what's still needed to actually enable it)

**Positioning**
- Chrome-extension "coming later" teaser on the landing page (not built — see below)

**Voice matching (Phase 1.5)** — the signature differentiator from [PRD §7.1a](./docs/PRD.md)
- Mandatory onboarding step (not a skippable toggle): a brand-new user pastes 2–3 of their own past LinkedIn posts before their first generation
- Implicit signal: a past generation's edited/selected text also feeds the prompt, no separate opt-in
- Few-shot injection into the generation prompt (up to 3 examples, explicit first), instructed to mirror rhythm/phrasing but never reuse specific facts or numbers
- Gating never retroactively blocks an existing account from before this shipped
- Live end-to-end verified against production with a real throwaway signup: onboarding gate appeared correctly, samples saved, gate lifted, a real screenshot upload → real Gemini generation succeeded and was stored, free-tier counter decremented correctly. Test account and its data deleted afterward.
- **Tone-conflict warning**: a dependency-free heuristic guesses which tone a user's samples read closest to; a non-blocking inline nudge appears if the selected tone disagrees, with a one-click switch

**Retention data foundation**
- Post-performance feedback loop: flopped / average / went viral + optional comment, shown 24h+ after generation on a post the user actually used. This is the signal Phase 3 retention work needs — didn't exist before.

**Screenshot-confirmation step** — trust-critical, since the whole pitch is "grounded in your real screenshot"
- Fires automatically the moment a screenshot is picked: a small, cheap Gemini vision call (`/api/extract-facts`) reads back up to 6 key facts (numbers, percentages, dates, labels) as an editable list — "here's what we read, check it's right" — before generation, not after
- Per-row edit and remove, "+ Add a fact to check" for anything missed; doesn't touch the free/paid generation cap (it's a preview step, not a generation)
- Confirmed facts are passed into `/api/generate` and treated as authoritative — the model is instructed not to alter, round, or replace them
- Best-effort: a failed extraction never blocks generation, same behavior as before this feature existed
- Live-verified against production with a real signup and a realistic multi-metric screenshot: extraction correctly read all 6 facts, an edited/corrected value ("312" → "310") correctly appeared in the generated post output instead of the screenshot's real number — proves user corrections genuinely override the model's own read, not just cosmetically
- Known gap, called out in the route's own comment: this route isn't behind the Vercel Firewall rate limit (Hobby plan's one custom rule is already spent on `/api/generate`) — worth adding if usage data shows abuse

---

## ⏳ Remaining

### Auth
- [ ] **Actually enable Google sign-in** — code is wired (button + callback handling), but two things only the account owner can do remain: (1) get a Google OAuth client ID/secret from Google Cloud Console, (2) enable the Google provider in the Supabase Dashboard's Auth settings and paste them in. Deliberately not something I'll do myself even with credentials in hand — it's a security-relevant settings change, not a code change.

### Product backlog (from 2026-09-14 reconciliation)
Candidates raised alongside the screenshot-confirmation UI; not started, no build order chosen yet.
- [ ] Regenerate/refine loop — "make it shorter," "regenerate this paragraph," lock facts while regenerating other text. Extends the existing per-variation edit box into an actual AI-assisted refinement loop.
- [ ] Post history upgrades — search, mark posted/saved, tags, one-click repurpose to a shorter version.
- [ ] Thread/carousel generation from one screenshot — a short thread or carousel outline alongside the single post, distinct from the already-deferred Phase 4 multi-screenshot carousel.
- Voice matching sample count (currently 2–3 onboarding samples, 3 used per prompt for token budget) — raising to 5–10 was floated but not decided; a tuning question, not new work.

### Pricing / voice matching v2
- [ ] Multi-voice-profile support ("Founder me," "Investor me," "Personal me" — 3 profiles on paid, 1 on free). This is a real feature, not a config tweak: new schema (profiles need their own labeled sample sets), a profile selector in the generation workspace, free-vs-paid gating on profile count. Not started — worth nailing down the UX before building.
- [ ] Annual-tier perk ("LinkedIn profile audit" or a personal onboarding call) — this is a service commitment, not something to build; needs the founder's own time, not code.

### Phase 2 — Launch & distribution (not started)
- [ ] Convert waitlist to launch invite
- [ ] Founder-led dogfood posts (using CaptionCraft to promote CaptionCraft) — **needs you**: actually posting 10x on your own LinkedIn and documenting results isn't something I can do
- [ ] Record a 30-second landing page demo video/GIF (upload screenshot → 3 voice-matched posts → copy) — **needs you**: screen recording your own usage
- [ ] Collect 3+ beta user quotes for landing page social proof — **needs you**: this requires real users, not something to fabricate
- [ ] Outreach: SaaSBOOMi, Turbostart, Peerlist, IndieHackers-India, YourStory/Inc42
- [ ] Cold DM ~100 Indian founders with a personalized demo
- [ ] Recruit ~20 beta users first (per the sprint plan's validation gate: if 5 of 20 say "this sounds like me" unprompted, ready for full distribution)
- [ ] Optional: separate email-capture waitlist specifically for "notify me when the Chrome extension drops"

### Phase 3 — Retention (feedback loop now shipped; the rest not started, gated on Phase 2 signal)
- [ ] Streak tracker + email nudges
- [ ] Repurpose posts to Twitter/X format
- [x] ~~Manual post-performance input~~ — shipped 2026-09-13, see above

### Phase 4 — Moat building (not started, gated on Phase 2/3 data)
- [ ] Multi-screenshot carousel generation
- [ ] Direct LinkedIn publish via official API
- [ ] GitHub / Product Hunt / Razorpay webhook triggers (skip the manual screenshot step)
- [ ] Hinglish generation (only if demand data supports it)

### Explicitly deferred / not building yet
- Chrome extension itself (only the landing-page teaser exists)
- Mobile app (no mobile app currently exists in this repo)
- Team/agency accounts
- Inbound lead scoring / DM tooling
- Broadening ICP beyond founders to general Indian professionals
