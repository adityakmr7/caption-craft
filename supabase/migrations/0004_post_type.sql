-- Post type templates (Milestone / Lesson / Contrarian / Data-Framework).
-- See app/api/generate/route.ts POST_TYPES and app/app/generation-workspace.tsx.

alter table public.generations
  add column if not exists post_type text not null default 'milestone'
    check (post_type in ('milestone', 'lesson', 'contrarian', 'data'));
