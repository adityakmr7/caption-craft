-- Anonymous breakage telemetry for the Chrome extension's LinkedIn
-- compose-box detection (see extension/entrypoints/content.ts). This is
-- the safety net for the exact failure mode that hit twice already:
-- LinkedIn silently changes its DOM (Quill -> Tiptap/ProseMirror), the
-- extension's selector stops matching, and the team only finds out when a
-- user reports it. This table lets a real "Insert" attempt that fails for
-- a DOM-related reason report that fact so breakage surfaces within
-- hours, not whenever someone happens to complain.
--
-- Deliberately anonymous and minimal — no user id, no LinkedIn page
-- content, no URL beyond a coarse category the extension itself derives
-- client-side (see classifySurface in entrypoints/sidepanel/api.ts).
-- There is nothing here that identifies a person or reveals what they
-- were posting about. No RLS policies are defined on purpose: only the
-- service-role client (app/lib/supabase/admin.ts), used from the
-- unauthenticated POST /api/extension/telemetry route, ever touches this
-- table.

create table if not exists public.extension_telemetry (
  id uuid primary key default gen_random_uuid(),
  reason text not null check (reason in ('no-compose-box', 'no-content-script')),
  surface text not null check (surface in ('feed', 'compose', 'messaging', 'profile-post', 'other')),
  extension_version text,
  created_at timestamptz not null default now()
);

alter table public.extension_telemetry enable row level security;

create index if not exists extension_telemetry_created_at_idx
  on public.extension_telemetry (created_at desc);
