-- Run this in the Supabase SQL Editor after migration_012_concepts_storyboard_agent.sql.
-- Adds per-shot video generation: a credit ledger, a jobs table, and the
-- video fields on each shot. Additive only: nothing existing is changed.
--
-- Credits stay tracked on profiles.credits_remaining exactly as before (the
-- dodo webhook and consume_credit already depend on that column). The new
-- credit_ledger table is an audit trail alongside it, recording every grant
-- and spend so a balance can always be reconstructed and double-spends or
-- double-grants can be proven not to have happened.

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  reason text not null
    check (reason in ('shot_generation', 'shot_generation_refund', 'admin_adjustment')),
  reference text,
  balance_after integer not null,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx
  on public.credit_ledger (user_id, created_at desc);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  shot_id uuid not null references public.storyboard_shots (id) on delete cascade,
  provider text not null,
  model text not null,
  status text not null default 'queued'
    check (status in ('queued', 'generating', 'ready', 'failed')),
  cost_credits integer not null,
  provider_job_id text,
  prompt text not null,
  input_image_path text not null,
  video_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generation_jobs_shot_idx
  on public.generation_jobs (shot_id, created_at desc);
create index if not exists generation_jobs_provider_job_idx
  on public.generation_jobs (provider, provider_job_id);

-- Idempotency for fal webhook deliveries, same pattern as dodo_webhook_log.
create table if not exists public.fal_webhook_log (
  request_id text primary key,
  status text not null,
  received_at timestamptz not null default now()
);

alter table public.storyboard_shots
  add column if not exists video_url text,
  add column if not exists video_status text not null default 'not_started'
    check (video_status in ('not_started', 'queued', 'generating', 'ready', 'failed')),
  add column if not exists video_error text,
  add column if not exists generation_count integer not null default 0,
  add column if not exists active_job_id uuid references public.generation_jobs (id) on delete set null;

alter table public.credit_ledger enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.fal_webhook_log enable row level security;

drop policy if exists "Users can view their own credit ledger" on public.credit_ledger;
create policy "Users can view their own credit ledger"
  on public.credit_ledger for select using (auth.uid() = user_id);

drop policy if exists "Users can view their own generation jobs" on public.generation_jobs;
create policy "Users can view their own generation jobs"
  on public.generation_jobs for select using (auth.uid() = user_id);

-- No policies on fal_webhook_log: written only by the webhook route via the
-- service-role key, never read by the browser.

revoke insert, update, delete on public.credit_ledger from authenticated, anon;
revoke insert, update, delete on public.generation_jobs from authenticated, anon;

-- Atomically checks the shot isn't already generating, checks the balance,
-- spends the credit, logs the ledger entry, and creates the job — all in
-- one transaction so a double-click or a race between two tabs can never
-- spend twice or generate two jobs for the same shot.
create or replace function public.reserve_shot_generation(
  p_user_id uuid,
  p_project_id uuid,
  p_shot_id uuid,
  p_cost integer,
  p_provider text,
  p_model text,
  p_prompt text,
  p_input_image_path text
)
returns table (job_id uuid, error text)
language plpgsql
security definer set search_path = public
as $$
declare
  v_balance integer;
  v_new_balance integer;
  v_job_id uuid;
  v_already boolean;
begin
  select exists(
    select 1 from public.generation_jobs
    where shot_id = p_shot_id and status in ('queued', 'generating')
  ) into v_already;
  if v_already then
    return query select null::uuid, 'already_generating'::text;
    return;
  end if;

  select credits_remaining into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if v_balance is null or v_balance < p_cost then
    return query select null::uuid, 'insufficient_credits'::text;
    return;
  end if;

  v_new_balance := v_balance - p_cost;

  update public.profiles set credits_remaining = v_new_balance where id = p_user_id;

  insert into public.credit_ledger (user_id, delta, reason, reference, balance_after)
  values (p_user_id, -p_cost, 'shot_generation', p_shot_id::text, v_new_balance);

  insert into public.generation_jobs
    (user_id, project_id, shot_id, provider, model, status, cost_credits, prompt, input_image_path)
  values
    (p_user_id, p_project_id, p_shot_id, p_provider, p_model, 'queued', p_cost, p_prompt, p_input_image_path)
  returning id into v_job_id;

  update public.storyboard_shots
  set video_status = 'queued', video_error = null, active_job_id = v_job_id,
      generation_count = generation_count + 1, updated_at = now()
  where id = p_shot_id and user_id = p_user_id;

  return query select v_job_id, null::text;
end;
$$;

revoke execute on function public.reserve_shot_generation(uuid, uuid, uuid, integer, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.reserve_shot_generation(uuid, uuid, uuid, integer, text, text, text, text)
  to service_role;

-- Marks a job submitted to the provider (queued -> generating) and records
-- the provider's own job id, so status checks and the webhook can find it.
create or replace function public.mark_job_submitted(
  p_job_id uuid,
  p_provider_job_id text
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.generation_jobs
  set provider_job_id = p_provider_job_id, status = 'generating', updated_at = now()
  where id = p_job_id and status = 'queued';

  update public.storyboard_shots
  set video_status = 'generating', updated_at = now()
  where active_job_id = p_job_id;
end;
$$;

revoke execute on function public.mark_job_submitted(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_job_submitted(uuid, text) to service_role;

-- Applies a job's outcome exactly once: on success, stores the video on the
-- shot; on failure (including a submission that never reached the
-- provider), refunds the spent credit. p_webhook_request_id claims webhook
-- deliveries so a retried delivery is a no-op; pass null when called from
-- the polling status check instead of a webhook.
create or replace function public.finalize_shot_generation(
  p_job_id uuid,
  p_webhook_request_id text,
  p_status text,
  p_video_url text,
  p_error text
)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_job record;
  v_balance integer;
  v_new_balance integer;
begin
  if p_webhook_request_id is not null then
    insert into public.fal_webhook_log (request_id, status)
    values (p_webhook_request_id, p_status)
    on conflict (request_id) do nothing;
    if not found then
      return 'duplicate';
    end if;
  end if;

  select * into v_job from public.generation_jobs where id = p_job_id for update;
  if v_job is null then
    return 'unmatched';
  end if;
  if v_job.status in ('ready', 'failed') then
    return 'already_finalized';
  end if;

  if p_status = 'ready' then
    update public.generation_jobs
    set status = 'ready', video_url = p_video_url, updated_at = now()
    where id = p_job_id;

    update public.storyboard_shots
    set video_status = 'ready', video_url = p_video_url, video_error = null, updated_at = now()
    where active_job_id = p_job_id;

    return 'applied';
  end if;

  -- Failure: refund the credit that reserve_shot_generation spent.
  update public.generation_jobs
  set status = 'failed', error = coalesce(p_error, 'Generation failed.'), updated_at = now()
  where id = p_job_id;

  update public.storyboard_shots
  set video_status = 'failed', video_error = coalesce(p_error, 'Generation failed.'), updated_at = now()
  where active_job_id = p_job_id;

  select credits_remaining into v_balance from public.profiles where id = v_job.user_id for update;
  v_new_balance := coalesce(v_balance, 0) + v_job.cost_credits;

  update public.profiles set credits_remaining = v_new_balance where id = v_job.user_id;

  insert into public.credit_ledger (user_id, delta, reason, reference, balance_after)
  values (v_job.user_id, v_job.cost_credits, 'shot_generation_refund', v_job.shot_id::text, v_new_balance);

  return 'applied';
end;
$$;

revoke execute on function public.finalize_shot_generation(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.finalize_shot_generation(uuid, text, text, text, text)
  to service_role;

notify pgrst, 'reload schema';
