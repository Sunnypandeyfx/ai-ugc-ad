-- Run this in the Supabase SQL Editor after migration_008_dodo_billing.sql,
-- AND only after the code from the same commit is deployed (the app now does
-- all table writes server-side; running this first would break ad creation).
--
-- Row-level security restricts which ROWS a user can touch, not which
-- COLUMNS. Every table previously let a signed-in user write any column of
-- their own rows straight through Supabase's public REST API, e.g.:
--   * profiles.credits_remaining / plan  -> unlimited paid renders
--   * custom_avatars.consent_status      -> skip the digital-twin consent gate
--   * generations.avatar_id / voice_id   -> render with another user's twin
-- From now on users can only READ (and delete) their own rows; every write
-- goes through server code using the service-role key after an ownership
-- check.

-- 1. Profiles: users may only change their display name.
revoke insert, update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- 2. App data tables: no direct inserts/updates from the browser.
revoke insert, update on public.products from authenticated, anon;
revoke insert, update on public.generations from authenticated, anon;
revoke insert, update on public.custom_avatars from authenticated, anon;

-- 3. Dodo webhook: claim the event and apply it in ONE transaction, so a
--    failed write rolls back the claim and Dodo's retry can process it.
alter table public.dodo_webhook_log
  add column if not exists outcome text;

create or replace function public.apply_dodo_subscription_event(
  p_webhook_id text,
  p_event_type text,
  p_user_id uuid,
  p_customer_id text,
  p_email text,
  p_subscription_id text,
  p_plan text,
  p_status text,
  p_credits integer
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid;
begin
  insert into dodo_webhook_log (webhook_id, event_type)
  values (p_webhook_id, p_event_type)
  on conflict (webhook_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  if p_user_id is not null then
    select id into v_user from profiles where id = p_user_id;
    if v_user is null then
      -- Accounts created before the profile trigger existed have no row yet.
      insert into profiles (id, email)
      select id, email from auth.users where id = p_user_id
      on conflict (id) do nothing
      returning id into v_user;
    end if;
  end if;
  if v_user is null and p_customer_id is not null then
    select id into v_user from profiles where dodo_customer_id = p_customer_id limit 1;
  end if;
  if v_user is null and p_email is not null then
    select id into v_user from profiles where lower(email) = lower(p_email) limit 1;
  end if;

  if v_user is null then
    update dodo_webhook_log set outcome = 'unmatched' where webhook_id = p_webhook_id;
    return 'unmatched';
  end if;

  update profiles set
    plan = coalesce(p_plan, plan),
    subscription_status = coalesce(p_status, subscription_status),
    credits_remaining = coalesce(p_credits, credits_remaining),
    dodo_customer_id = coalesce(p_customer_id, dodo_customer_id),
    dodo_subscription_id = coalesce(p_subscription_id, dodo_subscription_id)
  where id = v_user;

  update dodo_webhook_log set outcome = 'applied' where webhook_id = p_webhook_id;
  return 'applied';
end;
$$;

-- Functions are executable by PUBLIC by default. This one grants plans and
-- credits, so only the server (service role) may call it.
revoke execute on function public.apply_dodo_subscription_event(
  text, text, uuid, text, text, text, text, text, integer
) from public, anon, authenticated;
grant execute on function public.apply_dodo_subscription_event(
  text, text, uuid, text, text, text, text, text, integer
) to service_role;
