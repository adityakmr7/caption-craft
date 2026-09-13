-- Changes the free tier from a 3-lifetime-generations cap to 10/month.
-- Rationale (2026-09-13 sprint plan): 3 lifetime is too restrictive to
-- even calibrate voice matching — a founder burns the whole quota on
-- experiments before ever hitting the "this sounds like me" moment.
--
-- free_generations_used is now a *monthly* counter rather than a lifetime
-- one. free_period_start tracks which calendar month it's counting;
-- increment_free_generation resets the counter itself the first time a
-- user generates in a new month, rather than needing a separate cron/reset
-- job. Existing users' period_start defaults to their profile's creation
-- month via created_at — see the backfill below.

alter table public.profiles
  add column if not exists free_period_start timestamptz;

update public.profiles
  set free_period_start = date_trunc('month', created_at)
  where free_period_start is null;

alter table public.profiles
  alter column free_period_start set not null,
  alter column free_period_start set default date_trunc('month', now());

create or replace function public.increment_free_generation(p_user_id uuid)
returns table (allowed boolean, plan text, free_generations_used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_used int;
  v_period_start timestamptz;
  v_current_period timestamptz := date_trunc('month', now());
begin
  select p.plan, p.free_generations_used, p.free_period_start
    into v_plan, v_used, v_period_start
  from public.profiles p
  where p.id = p_user_id
  for update; -- row lock: serializes concurrent calls for this user

  if v_plan is null then
    return query select false, null::text, null::int;
    return;
  end if;

  -- Roll over into a new monthly window before checking the cap.
  if v_plan = 'free' and v_period_start < v_current_period then
    update public.profiles p
      set free_generations_used = 0, free_period_start = v_current_period
      where p.id = p_user_id;
    v_used := 0;
  end if;

  if v_plan = 'free' and v_used >= 10 then
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
