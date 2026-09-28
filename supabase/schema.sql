-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

-- Profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Products -----------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Users manage their own products"
  on public.products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Generations ----------------------------------------------------------------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  ad_type text not null check (ad_type in ('ugc', 'cinematic')),
  audience text not null,
  tone text,
  platform text not null,
  status text not null default 'queued'
    check (status in ('queued', 'script_ready', 'failed')),
  script jsonb,
  error text,
  avatar_id text,
  avatar_name text,
  voice_id text,
  heygen_video_id text,
  video_status text not null default 'not_started'
    check (video_status in ('not_started', 'rendering', 'ready', 'failed')),
  video_url text,
  video_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "Users manage their own generations"
  on public.generations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage: product images -----------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;

create policy "Users can upload their own product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own product images"
  on storage.objects for select
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
