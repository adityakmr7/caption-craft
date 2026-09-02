-- Razorpay subscription billing. See docs/PRD.md §7.1 and §10.
--
-- `profiles.plan` already had 'monthly'/'yearly' as allowed values from
-- 0001; this migration adds the columns needed to track a Razorpay
-- subscription against that plan, plus an idempotency table for webhook
-- delivery (Razorpay retries webhooks on non-2xx / timeout, so the same
-- event can arrive more than once).

alter table public.profiles
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text
    check (subscription_status in (
      'created', 'authenticated', 'active', 'pending',
      'halted', 'cancelled', 'completed', 'expired'
    )),
  add column if not exists current_period_end timestamptz;

-- One active Razorpay subscription per user at a time.
create unique index if not exists profiles_razorpay_subscription_id_idx
  on public.profiles (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- === billing_events ==========================================================
-- Raw log of processed Razorpay webhook events, keyed by Razorpay's own
-- event id, so a retried delivery is a no-op instead of double-applying a
-- state change (e.g. double-extending current_period_end).

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

-- Service-role only (webhook handler uses the admin client) — no RLS
-- policies needed since this table is never read/written from the client.
alter table public.billing_events enable row level security;
