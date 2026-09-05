-- AIX Vault: Migration 006 - Add pricing column & resource_types table
-- Run this in your Supabase SQL Editor.

-- 1. Add pricing column to resources table
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

-- 2. Create resource_types table for custom tool types
create table if not exists public.resource_types (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.resource_types enable row level security;

-- Public read for resource_types
drop policy if exists "public read resource_types" on public.resource_types;
create policy "public read resource_types" on public.resource_types for select using (true);

-- Admin write for resource_types
drop policy if exists "admin write resource_types" on public.resource_types;
create policy "admin write resource_types" on public.resource_types
  for all using (public.is_admin());

-- 3. Add resource_types to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_types'
  ) then
    alter publication supabase_realtime add table public.resource_types;
  end if;
end $$;

alter table public.resource_types replica identity full;

-- 4. Add saved_resources to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'saved_resources'
  ) then
    alter publication supabase_realtime add table public.saved_resources;
  end if;
end $$;

alter table public.saved_resources replica identity full;
