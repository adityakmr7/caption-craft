# CaptionCraft — Cost Analysis

Numbers below are the original planning estimates. Treat them as a model to validate against real usage once Phase 3+ ships (see [ROADMAP.md](./ROADMAP.md)), not as guaranteed figures — Whisper cost per video in particular depends on actual average video length, which is unknown until there's real usage data.

## Monthly cost by stage

| Stage | Users | Revenue | Costs | Profit | Margin |
|---|---|---|---|---|---|
| Development | 0 | $0 | ~$6/mo | -$6 | — |
| Early traction | 50 | $1,450/mo | ~$84/mo | $1,366/mo | 94% |
| Growth | 200 | $5,800/mo | ~$234/mo | $5,566/mo | 96% |
| Scale | 1,000 | $29,000/mo | ~$541/mo | $28,459/mo | 98% |

Revenue figures assume the full user base is on Pro ($29/mo) — a simplifying assumption for modeling, not a real plan-mix forecast. Real revenue will be lower once free-tier and Starter-plan users are mixed in; treat the margin percentage as more durable than the absolute revenue number.

## Startup cost

Domain ($10, one-time) + $0–$6/month infrastructure until there's real usage. No servers to provision, no model training or hosting.

## Per-unit economics

A 2-minute video costs ~$0.012 to transcribe via Whisper ($0.006/minute). At the Pro plan's effective per-video price (~$0.058 = $29 / 500 credits), that's roughly a 5x markup on the raw Whisper cost alone — before accounting for the fact that most users don't exhaust their credit quota (see below).

## Credit economics

| Plan | Price | Credits | Modeled API cost | Modeled margin |
|---|---|---|---|---|
| Free | $0 | 20 | ~$0.24 | — (acquisition cost, not profit) |
| Starter | $15/mo | 100 | ~$1.20 | 92% |
| Pro | $29/mo | 500 | ~$6.00 | 79% |
| Business | $79/mo | 2,000 | ~$24.00 | 70% |

**Why actual margin should run higher than modeled:** most subscribers won't use their full monthly quota. A Pro user modeled at 500 videos might really process ~200, dropping actual Whisper spend from ~$6.00 to ~$2.40/mo and pushing real margin toward 85–90%. This is an assumption to track, not a guarantee — if actual usage tracks closer to the full quota (e.g., because bulk-processing agencies buy Pro specifically to run it hard), margin will compress toward the modeled 79%, and pricing may need revisiting.

## Comparison to the alternative (video generator)

The reason CaptionCraft was chosen over a full AI video generator as the product to build:

| Factor | CaptionCraft | Video generator |
|---|---|---|
| API cost at 100 users | ~$150/month | ~$3,000+/month |
| Build time | ~2 weeks to MVP | 4–6 weeks |
| Solo maintainable | Easy | Hard |
| Profit margin | ~85% | ~40% |
| Risk if it fails | Low (little sunk cost) | High (API costs burned regardless of traction) |

At scale (1,000 users), a video generator's API costs were estimated at $15,000+/month — an order of magnitude beyond CaptionCraft's ~$541/month at the same user count, because Whisper transcription is far cheaper per unit than generative video inference.
