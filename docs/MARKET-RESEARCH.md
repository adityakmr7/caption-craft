# Market Research & Validation

**Last updated:** 2026-08-31

## Demand signals

- LinkedIn's own 2026 data: Indian members adding "Founder" to their profile grew **104% YoY** — the highest growth of any global market. One in eight LinkedIn users worldwide is now Indian (100M+ users). ([Outlook Business](https://www.outlookbusiness.com/corporate/gen-z-fuels-founder-boom-on-linkedin-up-104-yoy-in-india))
- 85% of Gen Z founders in India say AI tools are important to their business; 75% have multiple income streams (portfolio careers), a segment likely to under-invest time in content but still want visibility. ([CIOL](https://www.ciol.com/social/linkedin-founder-profiles-india-ai-portfolio-careers-11825951))
- Two India-specific competitors (PostPika, Linkmind) have already launched and grown in this exact space in 2026 — evidence of *validated*, not just hypothesized, willingness to pay. See [COMPETITORS.md](./COMPETITORS.md).

## Willingness to pay

- Indian SaaS buyers show 50–70% lower willingness-to-pay than US/EU buyers for equivalent products; successful global SaaS companies price India plans at 40–60% of US sticker price. ([upGrowth](https://upgrowth.in/saas-pricing-packaging-strategy-india-gtm/))
- Typical Indian micro-SaaS tiering: starter ₹299–499/mo, growth ₹999–1,999/mo, business ₹2,999–4,999/mo — our proposed ₹299/mo starter and ₹2,999/yr sit exactly at the validated starter band.
- PostPika's ₹799/mo anchor gives us room to position clearly below it on price while staying above "impulse-buy-then-churn" territory.

## Cost to launch (see [PRD.md](./PRD.md) §10 for the underlying stack)

### One-time

| Item | Cost |
|---|---|
| Domain | $0 — captioncraft.xyz already owned (confirmed unavailable-to-register, i.e. already held) |
| Business setup for payouts | $0 — Razorpay onboards individuals/proprietorships; GST only mandatory past ₹20L/yr turnover for services |

### Recurring, MVP stage (0–100 customers)

| Service | Free tier | Paid tier if outgrown |
|---|---|---|
| Vercel (hosting) | Hobby works for testing but is non-commercial-only | Pro: $20/mo/seat |
| Supabase (DB/auth) | Free tier pauses after 7 days idle — not production-safe | Pro: $25/mo |
| Razorpay (payments) | $0 fixed | ~2.36% per transaction after GST; **0% platform fee promo up to ₹5L GMV / 90 days for new 2026 merchants** |
| Resend (email) | ~3K emails/mo free | N/A at this scale |

**Floor to go live commercially: ~$0–45/month**, before AI generation cost.

## Unit economics — AI generation cost

Per screenshot-in → 3-posts-out generation (Claude, via Vercel AI Gateway):

- Input: ~1,500 tokens (compressed screenshot + prompt)
- Output: ~800 tokens (3 post drafts + hashtags)

| Model | Cost/generation | 30 generations/mo (daily cadence) |
|---|---|---|
| Claude Haiku 4.5 ($1/$5 per MTok) | ~$0.0055 | ~₹14/customer/month |
| Claude Sonnet 5 ($2/$10 per MTok) | ~$0.011 | ~₹28/customer/month |

Against ₹299/mo pricing, this is a **95%+ gross margin** even at Sonnet quality — AI cost is not the constraint on this business; distribution is.

### At 100 paying customers

| | Amount |
|---|---|
| Revenue (100 × ₹299/mo) | ₹29,900/mo |
| Infra (Vercel + Supabase) | ~₹3,500/mo |
| AI generation | ~₹1,400–2,800/mo |
| Razorpay fees | ~₹700/mo |
| **Net margin** | **~₹22,000–24,300/mo (~75–81%)** |

## Key risk the numbers don't capture

Unit economics are favorable; the open question is distribution and substitution, not cost. The target ICP (bootstrapped, technical, cash-conscious founders) is exactly the segment most likely to just use free ChatGPT/Claude directly instead of paying. See [PRD.md](./PRD.md) §11 Risks and [COMPETITORS.md](./COMPETITORS.md) §The real baseline competitor.

## Sources

- [Outlook Business — Gen Z Fuels Founder Boom on LinkedIn](https://www.outlookbusiness.com/corporate/gen-z-fuels-founder-boom-on-linkedin-up-104-yoy-in-india)
- [CIOL — AI-Led Entrepreneurship in India](https://www.ciol.com/social/linkedin-founder-profiles-india-ai-portfolio-careers-11825951)
- [upGrowth — SaaS Pricing & Packaging Strategy for India GTM](https://upgrowth.in/saas-pricing-packaging-strategy-india-gtm/)
- [Razorpay — Low Cost Payment Gateway in India, 2026 Guide](https://razorpay.com/blog/low-cost-payment-gateway-in-india-the-complete-decision-guide/)
- [Vercel Pricing 2026](https://costbench.com/software/developer-tools/vercel/)
- [Supabase Pricing 2026](https://uibakery.io/blog/supabase-pricing)
- Additional competitor sources in [COMPETITORS.md](./COMPETITORS.md)
