-- ==============================================================================
-- AIX Vault: Migration 010 - Add upvotes column & increment function
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Adds the upvotes integer column for viewer upvoting and an atomic increment RPC.
-- ==============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resources' and column_name = 'upvotes'
  ) then
    alter table public.resources add column upvotes integer not null default 0;
  end if;
end $$;

-- Create an index on upvotes for fast sorting
create index if not exists resources_upvotes_idx on public.resources (upvotes desc);

-- Function for atomic upvote increment/decrement by viewers
create or replace function public.increment_upvote(row_id text, delta integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.resources
  set upvotes = greatest(0, coalesce(upvotes, 0) + delta)
  where id = row_id
  returning upvotes into new_count;

  return coalesce(new_count, 0);
end;
$$;

-- Grant execution to all users (including anonymous viewers)
grant execute on function public.increment_upvote(text, integer) to anon, authenticated, service_role;
