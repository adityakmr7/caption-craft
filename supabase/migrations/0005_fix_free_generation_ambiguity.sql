-- Fix "column reference "free_generations_used" is ambiguous" (Postgres error
-- 42702). `returns table (..., free_generations_used int)` implicitly
-- declares free_generations_used as an OUT parameter/PL/pgSQL variable in
-- scope for the whole function body, which collides with the identically
-- named column on public.profiles inside the UPDATE ... SET ... RETURNING.
-- Fix: qualify the column with the table alias everywhere it's referenced
-- inside the UPDATE statement.

create or replace function public.increment_free_generation(p_user_id uuid)
returns table (allowed boolean, plan text, free_generations_used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_used int;
begin
  select p.plan, p.free_generations_used into v_plan, v_used
  from public.profiles p
  where p.id = p_user_id
  for update;

  if v_plan is null then
    return query select false, null::text, null::int;
    return;
  end if;

  if v_plan = 'free' and v_used >= 3 then
    return query select false, v_plan, v_used;
    return;
  end if;

  if v_plan = 'free' then
    update public.profiles p
    set free_generations_used = p.free_generations_used + 1
    where p.id = p_user_id
    returning p.free_generations_used into v_used;
  end if;

  return query select true, v_plan, v_used;
end;
$$;

grant execute on function public.increment_free_generation(uuid) to authenticated;
