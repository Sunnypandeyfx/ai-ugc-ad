-- Run this in the Supabase SQL Editor after migration_010_projects.sql.
-- Adds the Product and Brief steps of the project workflow. Additive only:
-- existing products, generations and projects are untouched.
--
-- Key rule: AI-detected product info (products.ai_analysis) is only an
-- assumption. Ads may only use products.confirmed_facts, which is written
-- when the customer reviews and confirms the details.

-- 1. Products: AI assumptions and customer-confirmed facts, kept separate.
alter table public.products
  add column if not exists brand_name text,
  add column if not exists category text,
  add column if not exists ai_analysis jsonb,
  add column if not exists analysis_status text not null default 'none'
    check (analysis_status in ('none', 'running', 'ready', 'failed')),
  add column if not exists analysis_error text,
  add column if not exists analysis_count integer not null default 0,
  add column if not exists analysis_started_at timestamptz,
  add column if not exists analyzed_at timestamptz,
  add column if not exists confirmed_facts jsonb,
  add column if not exists confirmed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Product assets: main/front/side/back photos, references, logo, brand.
create table if not exists public.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('main', 'front', 'side', 'back', 'reference', 'logo', 'brand')),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists product_assets_product_idx
  on public.product_assets (product_id, created_at);

alter table public.product_assets enable row level security;

drop policy if exists "Users can view their own product assets" on public.product_assets;
create policy "Users can view their own product assets"
  on public.product_assets for select
  using (auth.uid() = user_id);

-- Writes and deletes go through server code, which also removes the file.
revoke insert, update, delete on public.product_assets from authenticated, anon;

-- 3. Each project points at the product it advertises.
alter table public.projects
  add column if not exists product_id uuid references public.products (id) on delete set null;

-- 4. Creative brief, one per project.
create table if not exists public.project_briefs (
  project_id uuid primary key references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  objective text not null,
  audience text not null,
  platform text not null,
  ad_style text not null,
  tone text not null,
  duration_seconds integer not null check (duration_seconds in (15, 30, 45, 60)),
  cta text,
  advanced jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_briefs enable row level security;

drop policy if exists "Users can view their own briefs" on public.project_briefs;
create policy "Users can view their own briefs"
  on public.project_briefs for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.project_briefs from authenticated, anon;

-- 5. Storage for product assets. Separate from the classic flow's
--    product-images bucket so size/type limits are enforced by Supabase
--    without changing how the classic flow behaves.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-assets', 'product-assets', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own product assets" on storage.objects;
create policy "Users can upload their own product assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read their own product assets" on storage.objects;
create policy "Users can read their own product assets"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
