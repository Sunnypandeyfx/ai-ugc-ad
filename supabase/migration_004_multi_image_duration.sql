-- Run this in the Supabase SQL Editor after migration_003_credits.sql.

alter table public.products
  add column if not exists image_paths text[] not null default '{}';

alter table public.generations
  add column if not exists duration_seconds integer not null default 30;
