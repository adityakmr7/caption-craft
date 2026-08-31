# Roadmap

**Last updated:** 2026-08-31

Phases are scoped by outcome, not just time — don't start the next phase until the current one's exit criteria are met. Suggested calendar windows assume work starts now (2026-08-31); adjust to actual start date.

---

## Phase 0 — Pre-launch validation ✅ done

**What exists today**: landing page (`app/components/CaptionCraftLanding.tsx`), waitlist capture (`app/api/waitlist/route.ts` + Supabase), market research and positioning ([PRD.md](./PRD.md), [COMPETITORS.md](./COMPETITORS.md), [MARKET-RESEARCH.md](./MARKET-RESEARCH.md)).

**Exit criteria met**: positioning validated against real competitors; unit economics confirmed viable; ICP narrowed to build-in-public Indian founders.

---

## Phase 1 — MVP build

**Target window**: 2026-09-01 → 2026-09-21 (3 weeks)

**Ship**:
- Supabase schema for users, screenshot uploads, generations
- Screenshot upload UI (drag-drop/paste, client-side compress)
- Generation pipeline: image → Claude (via Vercel AI Gateway) → 3 post variations + hashtags
- Tone selector (Professional / Casual / Hype)
- Copy-to-clipboard + inline edit
- Post history view
- Auth (Supabase email/Google)
- Razorpay subscription checkout (₹299/mo, ₹2,999/yr) + UPI AutoPay
- Free tier: 3 lifetime generations, no card required
- Usage cap enforcement to bound AI cost exposure

**Exit criteria**: a founder can go from screenshot to copied post in under 60 seconds, end to end, with billing working in production.

**Full feature spec**: [PRD.md](./PRD.md) §7.1

---

## Phase 2 — Launch & distribution

**Target window**: 2026-09-22 → 2026-10-12 (3 weeks, runs partly in parallel with Phase 1 QA)

**Ship** (per the original growth plan):
- Convert waitlist to launch invite
- Founder-led posts on the founder's own LinkedIn/Twitter using the product itself (dogfooding as marketing)
- Outreach to Indian startup communities/newsletters: SaaSBOOMi, Turbostart, Peerlist, IndieHackers-India, YourStory/Inc42 (as press or partnership, not paid ads)
- Cold DM ~100 Indian founders directly with a personalized demo

**Exit criteria**: 100 paying customers OR clear signal from the first ~30 days of outreach on what's not converting (see [PRD.md](./PRD.md) §9 Success metrics) — either result determines Phase 3 scope.

---

## Phase 3 — Retention

**Target window**: 2026-10-13 → 2026-11-23 (6 weeks), gated on Phase 2 signal

**Ship**:
- Streak tracker + email nudges
- Repurpose to Twitter/X format
- Voice memory (learn from user's favorite past posts)
- Manual post-performance input to steer future generations

**Exit criteria**: weekly active generation rate among paid users ≥ 50% (target from [PRD.md](./PRD.md) §9).

**Full feature spec**: [PRD.md](./PRD.md) §7.2

---

## Phase 4 — Moat building

**Target window**: 2026-11-24 onward, gated on retention data and revenue justifying the investment

**Candidates** (prioritize based on what Phase 2/3 usage data shows, re-check [COMPETITORS.md](./COMPETITORS.md) before committing):
- Multi-screenshot carousel generation
- Direct LinkedIn publish via official API (compliance investment — see MagicPost precedent)
- GitHub / Product Hunt / Razorpay-Stripe webhook triggers, removing the manual screenshot step
- Hinglish generation (only if demand data shows it — Linkmind's current moat)

**Exit criteria**: not yet defined — set once Phase 3 data is in.

---

## Explicitly deferred / out of scope until data says otherwise

- Team/agency accounts
- Inbound lead scoring / DM tooling (PostPika's moat)
- Broadening ICP beyond founders to general Indian professionals

See [PRD.md](./PRD.md) §5 Non-goals for rationale.
