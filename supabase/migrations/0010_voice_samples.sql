-- Explicit voice-matching signal (PRD §7.1a): 2-3 past LinkedIn posts a
-- user pastes during onboarding, used as few-shot style examples in the
-- generation prompt so output matches their actual writing voice instead
-- of a generic tone dial.
--
-- The *implicit* signal needs no new schema — it already lives on
-- generations.variations + generations.selected_variation (the edited,
-- final text a user actually kept). See app/lib/voice.ts, which reads
-- both sources.

create table if not exists public.voice_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now()
);

alter table public.voice_samples enable row level security;

create policy "voice samples are owner-readable"
  on public.voice_samples for select
  using (auth.uid() = user_id);

create policy "voice samples are owner-insertable"
  on public.voice_samples for insert
  with check (auth.uid() = user_id);

create policy "voice samples are owner-deletable"
  on public.voice_samples for delete
  using (auth.uid() = user_id);

create index if not exists voice_samples_user_id_created_at_idx
  on public.voice_samples (user_id, created_at desc);
