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

drop policy if exists "users can update own row" on public.users;
create policy "users can update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

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
-- credit_transactions — audit log of every credit grant/spend (server-written)
-- ---------------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount int not null,
  type text not null,
  video_id uuid,
  description text,
  created_at timestamptz not null default now()
);
alter table public.credit_transactions enable row level security;

drop policy if exists "users can read own credit transactions" on public.credit_transactions;
create policy "users can read own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);
