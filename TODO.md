# TODO

**Last updated:** 2026-09-13 (pre-distribution sprint: tone warning, feedback loop, Google OAuth button, free tier → 10/month)

Quick-glance status. For the full phased plan and reasoning see [docs/ROADMAP.md](./docs/ROADMAP.md); for the dated build log see [docs/CHANGELOG.md](./docs/CHANGELOG.md). Everything below is verified against the live app/production config as of this date, not just doc claims — a couple of items in ROADMAP.md's "Still open" list (Razorpay checkout, the firewall rule) are actually done and are marked shipped here.

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

---

## ⏳ Remaining

### Auth
- [ ] **Actually enable Google sign-in** — code is wired (button + callback handling), but two things only the account owner can do remain: (1) get a Google OAuth client ID/secret from Google Cloud Console, (2) enable the Google provider in the Supabase Dashboard's Auth settings and paste them in. Deliberately not something I'll do myself even with credentials in hand — it's a security-relevant settings change, not a code change.

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
