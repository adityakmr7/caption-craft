# Product Requirements Document — CaptionCraft (LinkedIn Pivot)

**Status:** Draft v1
**Owner:** Aditya Kumar
**Last updated:** 2026-08-31

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
3. **Pick a tone**: Professional / Casual / Hype.
4. **Generate** → model reads the screenshot + tone and returns **3 post variations**, each with:
   - A hook line (first 2 lines — what shows before "see more")
   - Body copy (150–220 words)
   - 3–5 relevant hashtags pulled from a curated Indian-startup hashtag set (`#BuildInPublic`, `#StartupIndia`, `#SaaS`, `#IndianStartups`, etc.), not generic AI-picked ones
5. **Edit inline** if needed, then **copy** the chosen variation to clipboard.
6. Post is saved to the user's **history/library** for reuse or repurposing later.

## 7. Feature requirements

### 7.1 MVP (see [ROADMAP.md](./ROADMAP.md) Phase 1)

| Feature | Requirement |
|---|---|
| Screenshot upload | Accept PNG/JPG up to 10MB; client-side resize/compress before upload to control AI input-token cost |
| Post generation | 3 distinct variations per generation, generated via Claude (vision + text) through the Vercel AI Gateway; target < 8s p95 latency |
| Tone selector | Professional / Casual / Hype — changes voice, not facts |
| Hashtag suggestions | Curated static + AI-selected set, editable by the user before copying |
| Auth | Email/Google via Supabase |
| Billing | Razorpay subscription checkout — ₹299/mo, ₹2,999/yr; UPI AutoPay supported (3x higher recurring success than international cards for Indian users) |
| Free tier / trial | 3 free generations, no card required, to prove value before asking for payment |
| Post history | Every generation saved to the user's account, retrievable and re-copyable |
| Usage cap enforcement | Free tier capped at 3 lifetime generations; paid tier capped at a fair-use ceiling (e.g. 100/mo) to bound AI cost exposure |

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

- **Frontend/hosting**: Next.js App Router on Vercel (already scaffolded).
- **Auth/DB/storage**: Supabase (already wired for waitlist; extend schema for users, generations, screenshots).
- **AI**: Claude (Sonnet 5 default, Haiku 4.5 as a cost-down option) called through the Vercel AI Gateway rather than a raw provider SDK.
- **Payments**: Razorpay (subscriptions, UPI AutoPay support, INR-native).
- **Email**: Resend, for receipts and streak-nudge notifications.

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
