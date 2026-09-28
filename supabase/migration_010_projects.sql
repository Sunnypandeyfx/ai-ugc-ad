-- Run this in the Supabase SQL Editor after migration_009_security_hardening.sql.
-- Adds persistent ad projects: one row per ad the customer is producing,
-- tracking which workflow step they're on so they can leave and come back.
-- Existing generations are untouched and keep working.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled ad',
  status text not null default 'draft'
    check (status in ('draft', 'awaiting_approval', 'generating', 'completed', 'failed')),
  current_step text not null default 'product'
    check (current_step in ('product', 'brief', 'concept', 'storyboard', 'shots', 'final', 'export')),
  aspect_ratio text not null default '9:16'
    check (aspect_ratio in ('9:16', '16:9', '1:1')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx
  on public.projects (user_id, updated_at desc);

alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Same rule as migration_009: all writes go through server code.
revoke insert, update on public.projects from authenticated, anon;
