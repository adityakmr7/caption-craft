-- Phase 1 foundation: profiles (plan + free-tier usage), generations, and
-- the private screenshots storage bucket. See docs/PRD.md §7.1 and §10.
--
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query)
-- against the caption-craft project, or via `supabase db push` once the
-- project is linked with the Supabase CLI.

-- === profiles ===============================================================
-- One row per authenticated user. Tracks plan + free-tier usage so the app
-- can enforce the 3-lifetime-generation free cap (PRD §7.1) without a
-- separate billing call on every generation.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'monthly', 'yearly')),
  free_generations_used integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are self-updatable"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new Supabase Auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- === generations =============================================================
-- One row per screenshot -> 3-post-variations generation. `variations` holds
-- the model output as-is: [{ text, hashtags: string[] }, ...].

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  screenshot_path text not null,
  tone text not null check (tone in ('professional', 'casual', 'hype')),
  variations jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "generations are owner-readable"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "generations are owner-insertable"
  on public.generations for insert
  with check (auth.uid() = user_id);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

-- === screenshots storage bucket ==============================================
-- Private bucket. Objects are stored under `<user_id>/<filename>` so RLS can
-- scope access per-user via the first path segment.

insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

create policy "users can upload their own screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can read their own screenshots"
  on storage.objects for select
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete their own screenshots"
  on storage.objects for delete
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
