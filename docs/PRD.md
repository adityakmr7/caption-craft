# Product Requirements Document — CaptionCraft (LinkedIn Pivot)

**Status:** Phase 1 MVP — core generation loop live in production
**Owner:** Aditya Kumar
**Last updated:** 2026-09-01

**Since v1 of this doc, actual implementation has diverged in two places — both captured below and in [CHANGELOG.md](./CHANGELOG.md):**
- **AI provider**: shipped with Gemini 2.5 Flash (`@ai-sdk/google`) directly, not Claude via Vercel AI Gateway — the Gateway requires a card on file even for free credits, Google AI Studio's free tier doesn't. Revisit once billing exists.
- **Post length**: shipped as 200–400 words (not 150–220) to match LinkedIn's "see more" fold better at the post-type structures added below.

---

## 1. Problem

Indian startup founders are joining LinkedIn and posting "build in public" content at a record rate — LinkedIn reports a **104% YoY increase** in Indian members adding "Founder" to their profile, the highest growth of any market (see [MARKET-RESEARCH.md](./MARKET-RESEARCH.md)). But most of them:

- Have the *raw material* for a post (a revenue screenshot, a shipped feature, a Product Hunt launch, a Stripe/Razorpay payout) but not the time or copywriting instinct to turn it into a post.
- Default to either not posting at all, or pasting a screenshot description into ChatGPT and getting back generic, US-flavored copy ("Q3 OKRs," "synergy," $ instead of ₹).
- Are price-sensitive and won't pay $20–$65/mo Western tool pricing (Taplio, Supergrow) for something they'll use a few times a week.

## 2. Target user (ICP)

**Primary:** A solo or small-team Indian SaaS/startup founder (pre-seed to Series A, bootstrapped-leaning) who is actively documenting their build in public — shipping features, hitting revenue milestones, launching on Product Hunt — and wants to post about it on LinkedIn without writing from a blank page.

**Explicitly not the target (for v1):** general career-content creators, recruiters, agencies, or non-founder professionals. PostPika and Linkmind already serve that broader "Indian professional" market — see [COMPETITORS.md](./COMPETITORS.md). Staying narrow is the differentiation strategy, not a limitation.

## 3. Positioning

> The only LinkedIn tool that starts from a screenshot, not a blank prompt.

Every competitor we found (PostPika, Linkmind, Supergrow, Taplio, AuthoredUp, MagicPost) starts from an idea, topic, or URL. None start from "here's the artifact I already have — a screenshot of my dashboard, my MRR chart, my shipped UI." That's the product wedge. "India-first + rupee pricing" is necessary (PostPika and Linkmind already have it) but not sufficient as a differentiator on its own.

## 4. Goals

- Let a founder go from screenshot → publish-ready LinkedIn post in under 60 seconds.
- Make the output sound like an Indian founder talking, not a generic AI wrapper (INR references, Indian company/context examples, no "Q3 OKRs"-style Americanisms).
- Get to 100 paying customers at ₹299/mo (or ₹2,999/yr) within the first 90 days of public launch, validating the wedge before investing in a broader feature suite.

## 5. Non-goals (v1)

- No auto-publish to LinkedIn (LinkedIn's API/ToS makes this risky and MagicPost already differentiates on API compliance — we stay copy-to-clipboard for v1).
- No lead scoring / inbound DM tooling (PostPika's moat — not worth chasing head-on).
- No Hindi/Hinglish generation in v1 (Linkmind's moat) — revisit in v2 if demand signals it.
- No team/agency accounts in v1 — single-founder accounts only.

## 6. Core user flow

1. **Sign up** (email or Google via Supabase Auth).
2. **Upload a screenshot** (product UI, analytics dashboard, payment/payout notification, Product Hunt page, milestone graphic). Drag-drop or paste.
3. **Pick a post type** (Milestone / Lesson / Contrarian / Data) and a **tone** (Professional / Casual / Hype).
4. **Generate** → model reads the screenshot, post type, and tone and returns **3 post variations**, each with:
   - A hook line (first ~210 characters — what shows before "see more"), checked against a hook-quality heuristic (generic openers, missing numbers, bare engagement-bait flagged in the UI)
   - Body copy (200–400 words), with a live readability indicator (word count + short/good/long)
   - 3–5 relevant hashtags pulled from a curated Indian-startup hashtag set (`#BuildInPublic`, `#StartupIndia`, `#SaaS`, `#IndianStartups`, etc.), not generic AI-picked ones, individually removable
5. **Edit inline** if needed, then **copy** the chosen variation to clipboard — selection is recorded against the generation.
6. Post is saved to the user's **history/library**, tagged with tone and post type, for reuse or repurposing later.

## 7. Feature requirements

### 7.1 MVP (see [ROADMAP.md](./ROADMAP.md) Phase 1)

| Feature | Requirement | Status |
|---|---|---|
| Screenshot upload | Accept PNG/JPEG/WebP up to 10MB, drag-drop/paste/browse | ✅ shipped |
| Post generation | 3 distinct variations per generation, generated via Gemini 2.5 Flash (vision + text); atomic free-tier reservation to avoid race conditions on concurrent requests | ✅ shipped |
| Post type templates | Milestone / Lesson / Contrarian / Data — each with its own structure guidance in the prompt | ✅ shipped |
| Tone selector | Professional / Casual / Hype — changes voice, not facts | ✅ shipped |
| Readability + hook feedback | Word count/length indicator and hook-quality heuristics, client-side, no AI call | ✅ shipped |
| Hashtag suggestions | Curated AI-selected set, individually removable before copying | ✅ shipped |
| Auth | Email/password via Supabase; Google OAuth scaffolded, not yet wired to a client ID | ✅ shipped (email), ⏳ Google |
| Billing | Razorpay subscription checkout — ₹299/mo, ₹2,999/yr; UPI AutoPay | ⏳ not started |
| Free tier / trial | 3 free generations, no card required | ✅ shipped |
| Post history | Every generation saved with tone + post type + selected variation, retrievable and re-copyable | ✅ shipped |
| Usage cap enforcement | Free tier capped at 3 lifetime generations, enforced via row-locked Postgres RPC (not check-then-act) | ✅ shipped |
| API abuse protection | Vercel Firewall rate limit on `/api/generate` (10 req/5min/IP) | ⏳ staged, awaiting publish |
| Posting-time guidance | Static "best time to post" tip (Tue–Thu, 9 AM–5 PM IST) — no personalization | ✅ shipped |

### 7.2 V1 — retention (Phase 2)

- **Streak tracker**: visualize consecutive weeks the founder has posted, nudge via email if a week is about to break.
- **Repurpose**: turn one screenshot generation into a shorter Twitter/X variant.
- **Voice memory**: let the model learn from the user's 3–5 favorite past posts to better match their voice over time.
- **Basic post-performance input**: user can paste in how a post did (likes/comments) so future generations can lean toward what worked — no LinkedIn API dependency required, manual input is enough for v1.

### 7.3 V2 — moat building (Phase 3)

- **Multi-screenshot carousels**: turn a sequence of screenshots (e.g. a 5-step launch story) into a LinkedIn carousel/document post.
- **Direct LinkedIn publish**: via LinkedIn's official API once the product has enough usage volume to justify compliance investment (see MagicPost's approach as reference).
- **Community/import integrations**: pull GitHub commit messages, Product Hunt launch data, or Razorpay/Stripe milestone webhooks directly as generation triggers, removing the manual-screenshot step entirely.

## 8. Non-functional requirements

- **Cost per generation**: budget ≤ ₹30 (~$0.35) AI cost per user per month at expected usage (~30 generations/mo); see [MARKET-RESEARCH.md](./MARKET-RESEARCH.md) §Unit economics — current estimate is ₹14–28/customer/month, well inside budget.
- **Privacy**: uploaded screenshots may contain sensitive business data (revenue, user counts). Store uploads in private, per-user storage buckets; do not use customer screenshots to train models; support user-initiated deletion.
- **Availability**: no hard uptime SLA at MVP stage, but generation failures must degrade gracefully (clear error + no charge to usage cap on failure).
- **Localization**: currency, date, and example references in generated copy default to Indian context (₹, IST, Indian company names as examples) regardless of tone selected.

## 9. Success metrics

| Metric | MVP target (first 90 days) |
|---|---|
| Waitlist → signup conversion | ≥ 15% |
| Free trial → paid conversion | ≥ 8% |
| Paying customers | 100 |
| MRR | ₹29,900 (~$360) |
| Weekly active generators (of paid users) | ≥ 50% |
| Gross margin (revenue − AI + infra cost) | ≥ 85% |

## 10. Tech approach (summary)

- **Frontend/hosting**: Next.js 16 App Router on Vercel. ✅ live.
- **Auth/DB/storage**: Supabase — `profiles`/`generations` tables, RLS policies, `screenshots` storage bucket, atomic free-tier RPC. ✅ live.
- **AI**: Gemini 2.5 Flash via `@ai-sdk/google` (AI SDK v7, `generateText` + `Output.object`), called directly rather than through Vercel AI Gateway — see status note at the top of this doc. ✅ live.
- **Security**: Vercel Firewall rate-limit rule on `/api/generate` (staged, not yet published); RLS on all user data; service-role key server-only. ⏳ partial.
- **Payments**: Razorpay (subscriptions, UPI AutoPay support, INR-native). ⏳ not started — biggest gap toward the 100-paying-customer goal.
- **Email**: Resend, for receipts and streak-nudge notifications. ⏳ not started.

Full cost breakdown: [MARKET-RESEARCH.md](./MARKET-RESEARCH.md) §Cost to launch.

## 11. Risks & open questions

- **Competitive risk**: PostPika and Linkmind already occupy "India-first LinkedIn tool." If either adds a screenshot-first flow, the wedge narrows fast — ship the MVP quickly rather than gold-plating.
- **Substitution risk**: the target user is exactly the kind of person who'll just paste a screenshot description into free ChatGPT/Claude instead of paying. The product must clearly save more time/friction than that baseline to justify ₹299/mo — worth user-testing before heavy marketing spend.
- **Distribution risk**: no paid marketing budget assumed; growth depends on founder-led posting, community partnerships (SaaSBOOMi, Turbostart, Peerlist, IndieHackers-India), and cold outreach. This is unproven and should be tested in parallel with the build, not after.
- **Open question**: does the ICP want auto-publish enough to justify the LinkedIn API compliance cost sooner than Phase 3? Revisit after MVP usage data.

## 12. Appendix

- Competitive landscape: [COMPETITORS.md](./COMPETITORS.md)
- Market validation & unit economics: [MARKET-RESEARCH.md](./MARKET-RESEARCH.md)
- Build plan: [ROADMAP.md](./ROADMAP.md)
