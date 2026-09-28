-- Run this in the Supabase SQL Editor after migration_011_product_and_brief.sql.
-- Adds the Concept and Storyboard steps and the project agent's chat log.
-- Additive only: nothing existing is changed or removed.

-- 1. Concepts: three per round; the customer picks one.
create table if not exists public.project_concepts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  round integer not null,
  position integer not null check (position between 1 and 3),
  title text not null,
  logline text not null,
  hook text not null,
  beats jsonb not null default '[]'::jsonb,
  visual_style text not null,
  rationale text not null,
  facts_used jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_concepts_project_round_idx
  on public.project_concepts (project_id, round desc, position);

alter table public.projects
  add column if not exists concept_rounds integer not null default 0,
  add column if not exists storyboard_generations integer not null default 0,
  add column if not exists selected_concept_id uuid
    references public.project_concepts (id) on delete set null;

-- 2. Storyboard: one per project, with its shots in a separate table so
--    each shot keeps a stable id for per-shot generation later.
create table if not exists public.project_storyboards (
  project_id uuid primary key references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_id uuid references public.project_concepts (id) on delete set null,
  title text not null,
  summary text not null default '',
  cta text not null default '',
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.storyboard_shots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null,
  shot_type text not null
    check (shot_type in ('product', 'lifestyle', 'presenter', 'text')),
  duration_seconds integer not null check (duration_seconds between 1 and 10),
  scene text not null,
  camera text not null default '',
  on_screen_text text not null default '',
  voiceover text not null default '',
  sound text not null default '',
  facts_used jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists storyboard_shots_project_idx
  on public.storyboard_shots (project_id, position);

-- 3. Project agent chat log.
create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  changes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_messages_project_idx
  on public.project_messages (project_id, created_at);
create index if not exists project_messages_user_recent_idx
  on public.project_messages (user_id, created_at desc);

-- 4. Row-level security: customers read their own rows; every write goes
--    through server code (same rule as migrations 009-011).
alter table public.project_concepts enable row level security;
alter table public.project_storyboards enable row level security;
alter table public.storyboard_shots enable row level security;
alter table public.project_messages enable row level security;

drop policy if exists "Users can view their own concepts" on public.project_concepts;
create policy "Users can view their own concepts"
  on public.project_concepts for select using (auth.uid() = user_id);

drop policy if exists "Users can view their own storyboards" on public.project_storyboards;
create policy "Users can view their own storyboards"
  on public.project_storyboards for select using (auth.uid() = user_id);

drop policy if exists "Users can view their own shots" on public.storyboard_shots;
create policy "Users can view their own shots"
  on public.storyboard_shots for select using (auth.uid() = user_id);

drop policy if exists "Users can view their own project messages" on public.project_messages;
create policy "Users can view their own project messages"
  on public.project_messages for select using (auth.uid() = user_id);

revoke insert, update, delete on public.project_concepts from authenticated, anon;
revoke insert, update, delete on public.project_storyboards from authenticated, anon;
revoke insert, update, delete on public.storyboard_shots from authenticated, anon;
revoke insert, update, delete on public.project_messages from authenticated, anon;

notify pgrst, 'reload schema';
