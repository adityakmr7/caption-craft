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

A 2-minute video costs ~$0.001 to transcribe via Groq's Whisper endpoint ($0.04/hour ≈ $0.00067/minute, using `whisper-large-v3-turbo` — see [ARCHITECTURE.md Section 10.4](./ARCHITECTURE.md#104-transcription-provider-openai--groq-2026-07-25)). At the Pro plan's effective per-video price (~$0.058 = $29 / 500 credits), that's roughly a 58x markup on the raw transcription cost alone — before accounting for the fact that most users don't exhaust their credit quota (see below). This is cheaper than the original plan's OpenAI estimate (~$0.006/minute); the Groq switch was made for its development-friendly free tier, not for this cost difference, but the cost difference is real and favorable.

## Credit economics

| Plan | Price | Credits | Modeled transcription cost | Modeled margin |
|---|---|---|---|---|
| Free | $0 | 20 | ~$0.03 | — (acquisition cost, not profit) |
| Starter | $15/mo | 100 | ~$0.13 | ~99% |
| Pro | $29/mo | 500 | ~$0.67 | ~98% |
| Business | $79/mo | 2,000 | ~$2.66 | ~97% |

Updated for the Groq switch ([ARCHITECTURE.md Section 10.4](./ARCHITECTURE.md#104-transcription-provider-openai--groq-2026-07-25)); these were ~92/79/70% under the original OpenAI-rate estimate. Same 2-minute-average-video assumption as before, still directional not measured. **Transcription cost is no longer the binding cost driver either way** — it was already small under the OpenAI estimate and is smaller still under Groq's. The real cost/latency question is the render step for embed-mode captions (matting), covered in [ARCHITECTURE.md Section 10.2](./ARCHITECTURE.md#102-matting-benchmark--results-2026-07-24), not transcription.

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
