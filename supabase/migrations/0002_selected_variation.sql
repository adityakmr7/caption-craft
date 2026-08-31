-- Track which of the 3 generated variations the user actually picked, so
-- history can surface "the post you used" instead of all 3 every time.
-- See docs/PRD.md §7.1 (post history) and app/app/post-history.tsx.

alter table public.generations
  add column if not exists selected_variation smallint
    check (selected_variation is null or selected_variation between 0 and 2);

create policy "generations are owner-updatable"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
