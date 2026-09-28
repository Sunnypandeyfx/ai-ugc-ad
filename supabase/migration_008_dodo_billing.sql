-- Run this in the Supabase SQL Editor after migration_007_engine.sql.
-- Adds Dodo Payments subscription state to profiles and a webhook
-- idempotency log (mirrors the pattern used elsewhere in this app).

alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'starter', 'growth', 'agency')),
  add column if not exists dodo_customer_id text,
  add column if not exists dodo_subscription_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'on_hold', 'cancelled', 'expired'));

create index if not exists profiles_dodo_customer_id_idx
  on public.profiles (dodo_customer_id);

create table if not exists public.dodo_webhook_log (
  webhook_id text primary key,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.dodo_webhook_log enable row level security;
-- No policies: this table is written only by the webhook route using the
-- service-role key, and isn't read by end users.
