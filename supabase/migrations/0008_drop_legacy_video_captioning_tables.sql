-- Drops the pre-pivot "generic video-captioning tool" schema (see
-- AGENTS.md — CaptionCraft pivoted away from this product). These 7
-- tables predate migration 0001 and were never referenced anywhere in
-- this repo's code — confirmed via full-codebase grep before writing
-- this migration. Confirmed with the project owner that this old
-- product is not deployed/live anywhere before dropping.
--
-- Dropped in FK-dependency order (children before parents), not with
-- CASCADE, so this fails loudly instead of silently taking out
-- anything unexpected if the dependency graph below is somehow wrong:
--   captions.video_id -> videos
--   words.caption_id -> captions
--   videos.user_id, credit_transactions.user_id, subscriptions.user_id -> users
--   rate_limits has no FK (identifier/route-based, standalone)
--
-- Row counts at drop time (2026-09-03): users 1, videos 3, captions 40,
-- words 198, credit_transactions 3, subscriptions 0, rate_limits 4.

drop table if exists public.words;
drop table if exists public.captions;
drop table if exists public.videos;
drop table if exists public.credit_transactions;
drop table if exists public.subscriptions;
drop table if exists public.rate_limits;
drop table if exists public.users;
