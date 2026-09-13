# TODO

**Last updated:** 2026-09-13

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
- Free tier — 3 lifetime generations, atomic row-locked enforcement (no race condition)

**Billing**
- Razorpay subscription checkout (₹299/mo, ₹2,999/yr), cancel flow, webhook-driven status sync (`subscription.cancelled` → `billing_events` → `profiles` downgrade) — confirmed working end-to-end against a real test subscription

**Infra / security**
- Vercel Firewall rate limit on `POST /api/generate` (10 req/5min/IP) — published and enabled, not just staged
- RLS policies on all user data tables

**Design**
- Light theme, light as the unconditional default (not tied to OS `prefers-color-scheme`)
- Custom logo/brand mark, generated favicon + apple-icon from the same glyph

**Positioning**
- Google OAuth button hidden from `/login` (scaffolded, intentionally not wired — see below)
- Chrome-extension "coming later" teaser on the landing page (not built — see below)

---

## ⏳ Remaining

### Phase 1 close-out
- [ ] Wire Google OAuth (client ID/secret) — deferred to post-launch on purpose

### Phase 1.5 — Voice matching (not started)
No code yet — this is the signature differentiator called out in [PRD.md §7.1a](./docs/PRD.md).
- [ ] Onboarding step: paste 2–3 past LinkedIn posts (not skippable)
- [ ] Few-shot injection of the user's own past/edited posts into the generation prompt
- [ ] Fallback to today's tone-only behavior for zero-sample users

### Phase 2 — Launch & distribution (not started)
- [ ] Convert waitlist to launch invite
- [ ] Founder-led dogfood posts (using CaptionCraft to promote CaptionCraft)
- [ ] Outreach: SaaSBOOMi, Turbostart, Peerlist, IndieHackers-India, YourStory/Inc42
- [ ] Cold DM ~100 Indian founders with a personalized demo

### Phase 3 — Retention (not started, gated on Phase 2 signal)
- [ ] Streak tracker + email nudges
- [ ] Repurpose posts to Twitter/X format
- [ ] Manual post-performance input to steer future generations

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
