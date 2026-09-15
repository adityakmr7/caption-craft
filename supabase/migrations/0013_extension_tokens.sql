-- Personal access tokens for the Chrome extension (the "smart paste"
-- helper — insert a generated post into LinkedIn's compose box without
-- tab-switching, see docs/PRD.md and the landing-page teaser). The
-- extension can't share the web app's session cookie across origins
-- (fragile, and a known anti-pattern for extensions talking to their own
-- backend), so it authenticates with a long-lived bearer token the user
-- generates once in-app and pastes into the extension — the same pattern
-- as the GitHub/Vercel CLIs.
--
-- Only the SHA-256 hash of the token is stored, never the raw value —
-- identical reasoning to a password hash: a leaked row should not hand
-- out a usable credential. The raw token is shown to the user exactly
-- once, at creation time (see app/api/extension/tokens/route.ts).

create table if not exists public.extension_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.extension_tokens enable row level security;

-- Owner can list/revoke their own tokens (by id — the hash is never
-- selected back to the client, only used server-side for lookup).
create policy "extension tokens are owner-readable"
  on public.extension_tokens for select
  using (auth.uid() = user_id);

create policy "extension tokens are owner-insertable"
  on public.extension_tokens for insert
  with check (auth.uid() = user_id);

create policy "extension tokens are owner-deletable"
  on public.extension_tokens for delete
  using (auth.uid() = user_id);

create index if not exists extension_tokens_user_id_idx
  on public.extension_tokens (user_id);
