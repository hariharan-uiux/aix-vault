-- ==============================================================================
-- AIX Vault: Migration 009 - Add is_recommended column to resources table
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Adds the is_recommended boolean flag for admin tool recommendations.
-- ==============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resources' and column_name = 'is_recommended'
  ) then
    alter table public.resources add column is_recommended boolean not null default false;
  end if;
end $$;
