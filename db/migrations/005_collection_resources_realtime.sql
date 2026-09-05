-- AIX Vault: Migration 005 - Add collection_resources to Realtime
-- Run this in your Supabase SQL Editor to enable realtime for folder resource assignments.

-- Add collection_resources to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'collection_resources'
  ) then
    alter publication supabase_realtime add table public.collection_resources;
  end if;
end $$;

-- Set full replica identity for accurate diffs
alter table public.collection_resources replica identity full;
