-- AIX Vault: Migration 002 - Admin & User Role-Based Access Control (RLS)
-- Apply in Supabase SQL Editor after 001_init.sql

-- 1. Create Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2. Security Definer function to check admin status
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Automatic Profile Creation on Signup Trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_app_meta_data->>'role', new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Profiles RLS Policies
drop policy if exists "users read own or admin read all profiles" on public.profiles;
create policy "users read own or admin read all profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles"
  on public.profiles for update
  using (public.is_admin());

-- 5. Resources RLS (Public = Read-Only, Admin = Full CRUD)
drop policy if exists "public read public resources" on public.resources;
create policy "public read public resources" on public.resources
  for select using (is_public = true or public.is_admin());

drop policy if exists "owners insert resources" on public.resources;
drop policy if exists "admin insert resources" on public.resources;
create policy "admin insert resources" on public.resources
  for insert with check (public.is_admin());

drop policy if exists "owners update resources" on public.resources;
drop policy if exists "admin update resources" on public.resources;
create policy "admin update resources" on public.resources
  for update using (public.is_admin());

drop policy if exists "owners delete resources" on public.resources;
drop policy if exists "admin delete resources" on public.resources;
create policy "admin delete resources" on public.resources
  for delete using (public.is_admin());

-- 6. Resource Tags RLS
drop policy if exists "owners write resource tags" on public.resource_tags;
drop policy if exists "admin write resource tags" on public.resource_tags;
create policy "admin write resource tags" on public.resource_tags
  for all using (public.is_admin());

-- 7. Categories & Tags Management (Admin only write)
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories
  for all using (public.is_admin());

drop policy if exists "admin write tags" on public.tags;
create policy "admin write tags" on public.tags
  for all using (public.is_admin());

-- 8. Collections Management (Admin CRUD for global collections)
drop policy if exists "owners write collections" on public.collections;
drop policy if exists "admin write collections" on public.collections;
create policy "admin write collections" on public.collections
  for all using (public.is_admin() or auth.uid() = created_by);

drop policy if exists "owners write collection resources" on public.collection_resources;
drop policy if exists "admin write collection resources" on public.collection_resources;
create policy "admin write collection resources" on public.collection_resources
  for all using (public.is_admin());

-- 9. Convenience helper to easily promote an existing user to admin:
-- Usage: select public.promote_user_to_admin('your-email@example.com');
create or replace function public.promote_user_to_admin(target_email text)
returns text
language plpgsql
security definer
as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = target_email limit 1;
  if target_id is null then
    return 'User not found with email: ' || target_email;
  end if;

  insert into public.profiles (id, email, role)
  values (target_id, target_email, 'admin')
  on conflict (id) do update set role = 'admin', updated_at = now();

  return 'User promoted to admin successfully: ' || target_email;
end;
$$;
