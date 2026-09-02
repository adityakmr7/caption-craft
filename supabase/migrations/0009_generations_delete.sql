-- Lets a user delete their own generations (post-history "Delete" action).
-- `generations` already has owner-select and owner-insert policies
-- (0001); this adds the missing owner-delete policy. See
-- app/api/generations/[id]/route.ts DELETE handler.

create policy "generations are owner-deletable"
  on public.generations for delete
  using (auth.uid() = user_id);
