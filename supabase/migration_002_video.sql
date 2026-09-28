-- Run this in the Supabase SQL Editor after schema.sql.
-- Adds video-rendering support (HeyGen) to the generations table.

alter table public.generations
  add column if not exists avatar_id text,
  add column if not exists avatar_name text,
  add column if not exists voice_id text,
  add column if not exists heygen_video_id text,
  add column if not exists video_status text not null default 'not_started'
    check (video_status in ('not_started', 'rendering', 'ready', 'failed')),
  add column if not exists video_url text,
  add column if not exists video_error text;
