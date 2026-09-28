-- Run this in the Supabase SQL Editor after migration_005_custom_avatars.sql.
-- Distinguishes real-person "digital twin" creators from fully synthetic
-- AI-generated ones (which need no consent step).

alter table public.custom_avatars
  add column if not exists source text not null default 'digital_twin'
    check (source in ('digital_twin', 'prompt'));
