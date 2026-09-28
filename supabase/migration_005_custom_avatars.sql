-- Run this in the Supabase SQL Editor after migration_004_multi_image_duration.sql.
-- Lets a user train a custom "digital twin" creator from their own footage.

create table if not exists public.custom_avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  heygen_group_id text,
  heygen_look_id text,
  voice_id text,
  training_status text not null default 'uploading'
    check (training_status in ('uploading', 'training', 'ready', 'failed')),
  consent_status text not null default 'not_started'
    check (consent_status in ('not_started', 'pending', 'approved', 'declined')),
  consent_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.custom_avatars enable row level security;

create policy "Users manage their own custom avatars"
  on public.custom_avatars for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage: footage uploaded to train a custom avatar --------------------
insert into storage.buckets (id, name, public)
values ('custom-avatar-footage', 'custom-avatar-footage', false)
on conflict (id) do nothing;

create policy "Users can upload their own avatar footage"
  on storage.objects for insert
  with check (
    bucket_id = 'custom-avatar-footage'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own avatar footage"
  on storage.objects for select
  using (
    bucket_id = 'custom-avatar-footage'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
