-- Lightweight post-performance feedback loop (2026-09-13 roadmap addition).
-- Lets a user record how a post actually did on LinkedIn, 24h+ after
-- generation. This is the Phase 3 data foundation: without it there's no
-- signal on which templates/tones/voice-matched posts actually perform.
-- See app/app/post-feedback.tsx + app/api/post-feedback/route.ts.

create table if not exists public.post_feedback (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  outcome text not null check (outcome in ('flopped', 'average', 'viral')),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generation_id)
);

alter table public.post_feedback enable row level security;

create policy "post feedback is owner-readable"
  on public.post_feedback for select
  using (auth.uid() = user_id);

create policy "post feedback is owner-insertable"
  on public.post_feedback for insert
  with check (auth.uid() = user_id);

create policy "post feedback is owner-updatable"
  on public.post_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists post_feedback_user_id_idx
  on public.post_feedback (user_id);
