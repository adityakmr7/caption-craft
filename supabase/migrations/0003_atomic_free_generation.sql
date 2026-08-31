-- Fix a real race condition: the old check-then-act flow (SELECT the
-- counter, call Gemini, UPDATE the counter) let concurrent requests from
-- the same user all pass the check before any of them incremented it,
-- exceeding the 3-generation free cap and spending real Gemini quota on
-- every extra call. This function makes "check cap + reserve a slot"
-- one atomic, row-locked operation the API calls *before* touching Gemini.

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
  for update; -- row lock: serializes concurrent calls for this user

  if v_plan is null then
    return query select false, null::text, null::int;
    return;
  end if;

  if v_plan = 'free' and v_used >= 3 then
    return query select false, v_plan, v_used;
    return;
  end if;

  if v_plan = 'free' then
    update public.profiles
      set free_generations_used = free_generations_used + 1
      where id = p_user_id
      returning free_generations_used into v_used;
  end if;

  return query select true, v_plan, v_used;
end;
$$;

grant execute on function public.increment_free_generation(uuid) to authenticated;
