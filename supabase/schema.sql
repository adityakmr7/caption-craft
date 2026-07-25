-- CaptionCraft database schema
-- Source of truth for the Supabase Postgres schema. Applied directly via psql
-- (no Supabase CLI/migration tooling in use yet — see docs/ARCHITECTURE.md
-- Section 2 for why). Re-running this file is safe: every statement is
-- idempotent (IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS guards).

-- ---------------------------------------------------------------------------
-- waitlist (already shipped, included here for a single source of truth)
-- ---------------------------------------------------------------------------
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;

-- ---------------------------------------------------------------------------
-- users — mirrors auth.users with app-specific fields (plan, credits)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  plan text not null default 'free',
  credits int not null default 20,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;

drop policy if exists "users can read own row" on public.users;
create policy "users can read own row"
  on public.users for select
  using (auth.uid() = id);

-- No client-side update policy: public.users has no user-editable columns
-- yet (credits/plan must only change server-side, via deduct_credit() below
-- or a service-role write). A prior version of this schema had a permissive
-- "update own row" policy that let an authenticated user set their own
-- `credits` directly from the client - removed before it shipped.
drop policy if exists "users can update own row" on public.users;

-- New auth.users rows get a matching public.users row with 20 free credits.
-- SECURITY DEFINER so it can write despite RLS (no direct insert policy for users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic credit deduction: a single UPDATE ... WHERE credits >= amount is
-- inherently race-safe (Postgres locks the row for the duration of the
-- statement), no explicit transaction needed. Returns the new balance, or
-- null if the user didn't have enough credits (caller must check for null).
create or replace function public.deduct_credit(p_user_id uuid, p_amount int default 1)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining int;
begin
  update public.users
  set credits = credits - p_amount
  where id = p_user_id and credits >= p_amount
  returning credits into remaining;

  return remaining;
end;
$$;

-- ---------------------------------------------------------------------------
-- subscriptions — Stripe/Paddle subscription lifecycle (written by webhook only)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider_subscription_id text not null unique,
  status text not null,
  plan text not null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

drop policy if exists "users can read own subscriptions" on public.subscriptions;
create policy "users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- videos — one row per upload, tracks processing status end to end
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  original_url text,
  processed_url text,
  status text not null default 'pending', -- pending | processing | completed | failed
  style text not null,                    -- bold | neon | retro | cinematic | minimal | karaoke
  error_message text,
  duration_seconds numeric,
  credits_used int not null default 1,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.videos enable row level security;

drop policy if exists "users can read own videos" on public.videos;
create policy "users can read own videos"
  on public.videos for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- captions — transcript phrase groups per video (from Whisper output)
-- ---------------------------------------------------------------------------
create table if not exists public.captions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  text text not null,
  start_time numeric not null,
  end_time numeric not null
);
alter table public.captions enable row level security;

drop policy if exists "users can read own captions" on public.captions;
create policy "users can read own captions"
  on public.captions for select
  using (
    exists (
      select 1 from public.videos
      where videos.id = captions.video_id
      and videos.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- words — per-word timing within a caption group (word-level burn-in timing)
-- ---------------------------------------------------------------------------
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  caption_id uuid not null references public.captions(id) on delete cascade,
  text text not null,
  start_time numeric not null,
  end_time numeric not null,
  confidence numeric
);
alter table public.words enable row level security;

drop policy if exists "users can read own words" on public.words;
create policy "users can read own words"
  on public.words for select
  using (
    exists (
      select 1 from public.captions
      join public.videos on videos.id = captions.video_id
      where captions.id = words.caption_id
      and videos.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- credit_transactions — audit log of every credit grant/spend (server-written)
-- ---------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount int not null,
  type text not null,
  video_id uuid references public.videos(id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.credit_transactions enable row level security;

drop policy if exists "users can read own credit transactions" on public.credit_transactions;
create policy "users can read own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);
