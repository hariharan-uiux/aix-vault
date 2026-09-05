-- ==============================================================================
-- AIX Vault: Migration 007 - Consolidated Database Sync & Realtime Setup
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- This script is fully idempotent (safe to run multiple times).
-- It ensures all data entities (resources, folders, categories, tool types, pricing, saves, feedback)
-- are fully backed by Supabase and synchronized in real-time across all clients.
-- ==============================================================================

-- 1. ADD PRICING COLUMN TO RESOURCES TABLE
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resources' and column_name = 'pricing'
  ) then
    alter table public.resources add column pricing text not null default 'Freemium'
      check (pricing in ('Free', 'Freemium'));
  end if;
end $$;

-- 2. CREATE RESOURCE_TYPES TABLE (FOR DYNAMIC TOOL / ASSET TYPES)
create table if not exists public.resource_types (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.resource_types enable row level security;

-- Public read for resource_types
drop policy if exists "public read resource_types" on public.resource_types;
create policy "public read resource_types" on public.resource_types
  for select using (true);

-- Admin write for resource_types
drop policy if exists "admin write resource_types" on public.resource_types;
create policy "admin write resource_types" on public.resource_types
  for all using (public.is_admin());

-- 3. SEED DEFAULT RESOURCE TYPES (Matching App Taxonomy)
insert into public.resource_types (id, name, slug) values
  ('website', 'Website', 'website'),
  ('tool', 'Tool', 'tool'),
  ('ui-kit', 'UI Kit', 'ui-kit'),
  ('component-library', 'Component Library', 'component-library'),
  ('icon-library', 'Icon Library', 'icon-library'),
  ('font', 'Font', 'font'),
  ('illustration', 'Illustration', 'illustration'),
  ('3d', '3D', '3d'),
  ('template', 'Template', 'template'),
  ('article', 'Article', 'article'),
  ('video', 'Video', 'video'),
  ('course', 'Course', 'course'),
  ('community', 'Community', 'community'),
  ('open-source', 'Open Source', 'open-source'),
  ('ai-tool', 'AI Tool', 'ai-tool'),
  ('ai-image', 'AI Image', 'ai-image'),
  ('api', 'API', 'api'),
  ('library', 'Library', 'library'),
  ('plugin', 'Plugin', 'plugin'),
  ('design-system', 'Design System', 'design-system'),
  ('color', 'Color', 'color'),
  ('inspiration', 'Inspiration', 'inspiration'),
  ('shaders', 'Shaders', 'shaders'),
  ('mock-up', 'Mockup', 'mock-up'),
  ('image', 'Image', 'image'),
  ('animation', 'Animation', 'animation'),
  ('web-dev-design', 'Web Design', 'web-dev-design'),
  ('widgets', 'Widgets', 'widgets'),
  ('hosting', 'Hosting', 'hosting'),
  ('organization', 'Organization', 'organization'),
  ('other', 'Other', 'other')
on conflict (id) do nothing;

-- 4. CREATE FEEDBACK TABLE (Viewer Suggestions & Bug Reports)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "Allow public feedback inserts" on public.feedback;
create policy "Allow public feedback inserts"
  on public.feedback
  for insert
  to public
  with check (true);

drop policy if exists "Admins can view feedback" on public.feedback;
create policy "Admins can view feedback"
  on public.feedback
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update feedback" on public.feedback;
create policy "Admins can update feedback"
  on public.feedback
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete feedback" on public.feedback;
create policy "Admins can delete feedback"
  on public.feedback
  for delete
  to authenticated
  using (public.is_admin());

-- 5. ENSURE PUBLIC READ ACCESS FOR COLLECTIONS (Public directory folders)
drop policy if exists "read collections" on public.collections;
create policy "read collections" on public.collections
  for select using (true);

drop policy if exists "read collection resources" on public.collection_resources;
create policy "read collection resources" on public.collection_resources
  for select using (true);

-- 6. POLICIES ON SAVED_RESOURCES
drop policy if exists "users read own saved" on public.saved_resources;
create policy "users read own saved" on public.saved_resources
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "users write own saved" on public.saved_resources;
create policy "users write own saved" on public.saved_resources
  for all using (auth.uid() = user_id or public.is_admin());

-- 7. REALTIME PUBLICATION: ENSURE ALL SYNC TABLES ARE PUBLISHED
do $$
begin
  -- resources
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resources'
  ) then
    alter publication supabase_realtime add table public.resources;
  end if;

  -- categories
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;

  -- collections
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collections'
  ) then
    alter publication supabase_realtime add table public.collections;
  end if;

  -- collection_resources
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collection_resources'
  ) then
    alter publication supabase_realtime add table public.collection_resources;
  end if;

  -- resource_types
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_types'
  ) then
    alter publication supabase_realtime add table public.resource_types;
  end if;

  -- saved_resources
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'saved_resources'
  ) then
    alter publication supabase_realtime add table public.saved_resources;
  end if;
end $$;

-- 8. SET REPLICA IDENTITY FULL (Ensures Realtime broadcasts complete row data)
alter table public.resources replica identity full;
alter table public.categories replica identity full;
alter table public.collections replica identity full;
alter table public.collection_resources replica identity full;
alter table public.resource_types replica identity full;
alter table public.saved_resources replica identity full;
