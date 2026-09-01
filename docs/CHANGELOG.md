# Changelog

Dated build log for CaptionCraft. Written for humans, not machines — groups by what shipped and why, not just commit messages. See [ROADMAP.md](./ROADMAP.md) for what's still ahead.

---

## 2026-08-31 — Post type templates, readability/hook feedback, posting-time tip

PR [#4](https://github.com/adityakmr7/caption-craft/pull/4) · `154aeef`

Picked from a larger pasted feature backlog: shipped the items that needed no new 3rd-party dependency.

- **Post type templates** — Milestone / Lesson / Contrarian / Data, selectable as a 2×2 card grid. Each type carries its own structure guidance fed into the Gemini prompt, so the generated post follows a genuinely different shape per type, not just a different label. Backend: `supabase/migrations/0004_post_type.sql` adds the column; `app/api/generate/route.ts` validates and stores it.
- **Character counter + readability score** — pure, dependency-free heuristic (`app/app/text-analysis.ts`), shown per variation card (word count + short/good/long).
- **Hook optimizer** — flags generic openers ("Excited to announce…"), a hook with no number in it, and bare engagement-bait endings ("Thoughts?").
- **Static posting-time tip** — "Best time to post (India): Tue–Thu, 9 AM–5 PM IST", placed near the Generate button. No personalization, no 3rd-party data — deliberately static for this pass.
- Post history now shows a `post_type` badge next to the tone chip.
- Post length target widened from 150–220 to 200–400 words to give each post-type structure room to breathe.

**Bug found and fixed during live verification**: `increment_free_generation`'s `returns table (..., free_generations_used int)` implicitly declared `free_generations_used` as a PL/pgSQL variable in scope for the whole function body, colliding with the identically-named column inside `UPDATE ... SET ... RETURNING` — threw `column reference is ambiguous` (Postgres 42702) on **every** free-tier generation attempt. Fixed in `supabase/migrations/0005_fix_free_generation_ambiguity.sql` by qualifying the column with the table alias. Caught by an end-to-end browser test, not by `tsc`/`eslint`/`next build` — SQL bugs inside `security definer` functions don't surface in a TypeScript build.

**Verified**: `tsc --noEmit`, `eslint`, `next build` clean; live pass — signed in, selected a post type, uploaded a screenshot, generated, selected a variation, confirmed `post_type`/`tone`/`selected_variation` all persisted via direct SQL query.

---

## 2026-08-31 — Security & rate limiting audit

Not a standalone PR — folded into the work below and the Vercel Firewall setup that followed it.

- Audited the generation pipeline for abuse surface ahead of going live.
- Added the atomic free-tier check in `increment_free_generation` (row-locked `for update`) to close a check-then-act race: concurrent requests from the same signed-in user could previously all pass the free-tier check before any of them incremented the counter, spending real Gemini quota past the cap.
- Raised `next.config.ts`'s `experimental.proxyClientMaxBodySize` to `15mb` — the framework default of 10MB was silently truncating screenshot uploads with no error surfaced to the user (`15a76cf`).
- Staged a Vercel Firewall `rate_limit` rule on `POST /api/generate` — 10 requests / 5 minutes / IP, since each request calls Gemini + Storage and is the most expensive endpoint in the app. **Staged only** — a WAF rule change is production-wide and immediate once published, so it's left for the project owner to run `vercel firewall publish --yes` themselves rather than auto-published.
- `/api/waitlist` is left unprotected by Firewall for now — the Hobby plan allows only one `rate_limit` rule per project, and `/api/generate` (auth-gated, AI-cost-bearing) is the higher-priority target.

---

## 2026-08-31 — Phase 1: auth foundation + screenshot-to-post generation pipeline

PR [#3](https://github.com/adityakmr7/caption-craft/pull/3) · `bfe7f3d`, `15a76cf`, `e36cc2d`

The core MVP loop — the first version of the product that actually generates a post.

**Database** (`supabase/migrations/0001`–`0003`):
- `profiles` (plan, free_generations_used) and `generations` (screenshot_path, tone, variations jsonb) tables, RLS policies on both.
- `screenshots` private storage bucket, per-user paths.
- `handle_new_user()` trigger to provision a profile row on signup.
- `selected_variation` column + owner-updatable RLS policy, so a user can record which of the 3 variations they actually used.
- `increment_free_generation` RPC for atomic free-tier enforcement (see above).

**Auth**:
- Split the old single `supabase-server.ts` into `app/lib/supabase/{admin,client,server}.ts` — service-role (server-only, bypasses RLS), browser client, and session-aware server client (`getUser()` via `supabase.auth.getUser()`, not `getSession()`, for security).
- `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`, function must be named `proxy`) for session refresh and route protection on `/app`.
- Email/password sign-in wired end-to-end; a real "Log in" link added to the landing page nav after user testing surfaced it was missing entirely.
- Google OAuth scaffolded but not wired to a client ID.

**Generation pipeline** (`app/api/generate/route.ts`):
- Screenshot upload (drag-drop/paste/click), tone selector (Professional/Casual/Hype), Gemini 2.5 Flash (`@ai-sdk/google`) call with structured output (`generateText` + `Output.object`, AI SDK v7) returning 3 variations with hashtags.
- Switched from Vercel AI Gateway to calling Gemini directly — the Gateway requires a card on file even to use free credits; Google AI Studio's free tier doesn't.
- Screenshot uploaded to Storage only *after* generation succeeds, so a failed generation never orphans a file.
- Free-tier slot reserved *before* the Gemini call and refunded on failure, so a failed generation never costs the user one of their 3 free uses.

**Post history & UX**:
- `app/app/post-history.tsx` — shows what was generated, what was actually selected, and the other 2 variations collapsed behind "Show other variations".
- Auto-growing textarea for inline editing; "Use this one" copies to clipboard and PATCHes the selection back to the generation row.

**Fixed along the way**: `mobile/` (an untracked Expo scaffold) was polluting the single TS program via its own `@types/react` stub, breaking `FormData` typing project-wide — excluded via `tsconfig.json`.

---

## 2026-08-31 — LinkedIn pivot: docs + landing page redesign

PR [#2](https://github.com/adityakmr7/caption-craft/pull/2) · `04130b8`

- Wrote [PRD.md](./PRD.md), [ROADMAP.md](./ROADMAP.md), [COMPETITORS.md](./COMPETITORS.md), [MARKET-RESEARCH.md](./MARKET-RESEARCH.md) — market validation and positioning for the pivot from a generic video-captioning tool to a LinkedIn post generator for Indian build-in-public founders.
- Redesigned `app/components/CaptionCraftLanding.tsx` around the new positioning.

---

## 2026-07-22 — Initial scaffold

`e7a9e1f`, `8f84399`

- `create-next-app` scaffold + first landing page pass, pre-pivot.
