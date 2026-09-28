-- Run this in the Supabase SQL Editor after migration_006_prompt_avatars.sql.
-- Some avatar looks only support the avatar_iii rendering engine, not the
-- avatar_iv default, so we now record which engine to request per ad.

alter table public.generations
  add column if not exists engine text;
