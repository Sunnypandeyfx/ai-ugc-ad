-- Run this in the Supabase SQL Editor after migration_002_video.sql.
-- Adds a simple free-trial credit balance, spent on each video render.

alter table public.profiles
  add column if not exists credits_remaining integer not null default 3;

-- Atomically consumes one credit for the calling user (auth.uid()).
-- Returns remaining credits on success, or -1 if none were left.
-- Self-heals a missing profile row (e.g. accounts created before this table existed).
create or replace function public.consume_credit()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  remaining integer;
begin
  insert into public.profiles (id, email)
  select auth.uid(), (select email from auth.users where id = auth.uid())
  on conflict (id) do nothing;

  update public.profiles
  set credits_remaining = credits_remaining - 1
  where id = auth.uid() and credits_remaining > 0
  returning credits_remaining into remaining;

  if remaining is null then
    return -1;
  end if;
  return remaining;
end;
$$;

grant execute on function public.consume_credit() to authenticated;
