-- AIX Vault: Migration 004 - Realtime Replication & Synchronization Fixes
-- Run this in your Supabase SQL Editor to enable live multi-client updates across all devices.

-- 1. Enable Supabase Realtime publication for resources, categories, and collections
do $$
begin
  -- Add resources
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resources'
  ) then
    alter publication supabase_realtime add table public.resources;
  end if;

  -- Add categories
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;

  -- Add collections
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collections'
  ) then
    alter publication supabase_realtime add table public.collections;
  end if;

  -- Add resource_tags
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_tags'
  ) then
    alter publication supabase_realtime add table public.resource_tags;
  end if;
end $$;

-- 2. Ensure Full Replication Identity for accurate Realtime diffs
alter table public.resources replica identity full;
alter table public.categories replica identity full;
alter table public.collections replica identity full;
alter table public.resource_tags replica identity full;

-- 3. Confirm public read policies for all viewers
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);

drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags for select using (true);

drop policy if exists "public read public resources" on public.resources;
create policy "public read public resources" on public.resources
  for select using (is_public = true or public.is_admin());

drop policy if exists "public read resource tags" on public.resource_tags;
create policy "public read resource tags" on public.resource_tags for select using (true);

drop policy if exists "read collections" on public.collections;
create policy "read collections" on public.collections
  for select using (true);

drop policy if exists "read collection resources" on public.collection_resources;
create policy "read collection resources" on public.collection_resources for select using (true);
