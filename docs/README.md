# CaptionCraft Docs

Planning documents for CaptionCraft, synthesized from the original ideation conversation (see [PRD.md](../PRD.md) at the repo root for the raw source) and reconciled against what's actually been built.

- **[PRD.md](./PRD.md)** — what the product is, who it's for, scope, pricing, validation plan, open questions
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — tech stack, database schema, system flow, auth decision, env vars, API routes
- **[ROADMAP.md](./ROADMAP.md)** — phased build plan from current state (landing page + waitlist) to full launch
- **[COST-ANALYSIS.md](./COST-ANALYSIS.md)** — unit economics, cost-by-stage modeling, credit pricing rationale

## Current state, in one paragraph

The landing page and waitlist capture are live (Next.js + Supabase). Nothing past that — upload, transcription, styling, billing — has been built yet, by design: the plan calls for hitting a validation gate (50+ waitlist signups, 3+ pre-sales by Week 3) before writing any of the video-processing pipeline. See [PRD.md Section 7](./PRD.md#7-validation-plan-do-this-before-writing-product-code) and [ROADMAP.md Phase 0](./ROADMAP.md#phase-0--validation-current-phase).

## Two decisions flagged for review

These depart from the original raw plan and are called out explicitly rather than silently assumed:

1. **No ORM.** The original plan specified Prisma; the shipped waitlist feature uses `@supabase/supabase-js` directly. See [ARCHITECTURE.md Section 2](./ARCHITECTURE.md#2-decision-no-orm-for-v1).
2. **Auth provider undecided.** The original plan specified Clerk; since Supabase is already in use for Postgres, Supabase Auth is recommended to avoid a second vendor. See [ARCHITECTURE.md Section 4](./ARCHITECTURE.md#4-auth).
