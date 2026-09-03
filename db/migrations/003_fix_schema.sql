-- AIX Vault: Migration 003 - Schema Migration & Clean Slate
-- Run this in your Supabase SQL Editor.
-- This ensures:
-- 1. All ID and category columns use TEXT (supporting slugs and UUIDs)
-- 2. All dummy / sample data is completely removed (leaving a clean slate)
-- 3. Category & tag taxonomy is populated so you can organize your resources
-- 4. Full RLS policies are set up for public viewer read and admin write

-- 1. Drop existing constraints that enforce UUID foreign keys
alter table if exists public.resources drop constraint if exists resources_category_id_fkey;
alter table if exists public.resource_tags drop constraint if exists resource_tags_tag_id_fkey;
alter table if exists public.resource_tags drop constraint if exists resource_tags_resource_id_fkey;
alter table if exists public.collection_resources drop constraint if exists collection_resources_collection_id_fkey;
alter table if exists public.collection_resources drop constraint if exists collection_resources_resource_id_fkey;
alter table if exists public.saved_resources drop constraint if exists saved_resources_resource_id_fkey;
alter table if exists public.categories drop constraint if exists categories_parent_id_fkey;

-- 2. Alter column types to text (supports both slugs and UUIDs)
alter table if exists public.categories alter column id type text;
alter table if exists public.categories alter column parent_id type text;
alter table if exists public.tags alter column id type text;
alter table if exists public.collections alter column id type text;
alter table if exists public.resources alter column id type text;
alter table if exists public.resources alter column category_id type text;
alter table if exists public.resource_tags alter column resource_id type text;
alter table if exists public.resource_tags alter column tag_id type text;
alter table if exists public.collection_resources alter column collection_id type text;
alter table if exists public.collection_resources alter column resource_id type text;
alter table if exists public.saved_resources alter column resource_id type text;

-- 3. Re-add foreign key constraints with text type
alter table public.categories
  add constraint categories_parent_id_fkey foreign key (parent_id) references public.categories(id) on delete set null;

alter table public.resources
  add constraint resources_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null;

alter table public.resource_tags
  add constraint resource_tags_resource_id_fkey foreign key (resource_id) references public.resources(id) on delete cascade;

alter table public.resource_tags
  add constraint resource_tags_tag_id_fkey foreign key (tag_id) references public.tags(id) on delete cascade;

alter table public.collection_resources
  add constraint collection_resources_collection_id_fkey foreign key (collection_id) references public.collections(id) on delete cascade;

alter table public.collection_resources
  add constraint collection_resources_resource_id_fkey foreign key (resource_id) references public.resources(id) on delete cascade;

alter table public.saved_resources
  add constraint saved_resources_resource_id_fkey foreign key (resource_id) references public.resources(id) on delete cascade;

-- 4. Enable RLS on all tables
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.resources enable row level security;
alter table public.resource_tags enable row level security;
alter table public.collections enable row level security;
alter table public.collection_resources enable row level security;
alter table public.saved_resources enable row level security;

-- Ensure public read policies exist
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
  for select using (created_by = auth.uid() or created_by is null or public.is_admin());

drop policy if exists "read collection resources" on public.collection_resources;
create policy "read collection resources" on public.collection_resources for select using (true);

-- Ensure admin write policies exist
drop policy if exists "admin insert resources" on public.resources;
create policy "admin insert resources" on public.resources
  for insert with check (public.is_admin());

drop policy if exists "admin update resources" on public.resources;
create policy "admin update resources" on public.resources
  for update using (public.is_admin());

drop policy if exists "admin delete resources" on public.resources;
create policy "admin delete resources" on public.resources
  for delete using (public.is_admin());

drop policy if exists "admin write resource tags" on public.resource_tags;
create policy "admin write resource tags" on public.resource_tags
  for all using (public.is_admin());

drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories
  for all using (public.is_admin());

drop policy if exists "admin write tags" on public.tags;
create policy "admin write tags" on public.tags
  for all using (public.is_admin());

drop policy if exists "admin write collections" on public.collections;
create policy "admin write collections" on public.collections
  for all using (public.is_admin() or auth.uid() = created_by);

drop policy if exists "admin write collection resources" on public.collection_resources;
create policy "admin write collection resources" on public.collection_resources
  for all using (public.is_admin());

-- 5. Clear all sample data (resources, collections, tags relations)
truncate table public.resource_tags, public.collection_resources, public.saved_resources, public.resources, public.collections cascade;

-- 6. Seed Categories Taxonomy
insert into public.categories (id, name, slug, description, parent_id) values
  ('development', 'Developer Tools', 'development', 'Libraries, APIs, frameworks, and developer tools', null),
  ('design', 'Design Tools', 'design', 'UI/UX, design systems, typography, icons, and visual craft', null),
  ('development-developer-tools', 'Developer Tools', 'development-developer-tools', 'Developer Tools', 'development'),
  ('development-react', 'React', 'development-react', 'React', 'development'),
  ('development-vue', 'Vue', 'development-vue', 'Vue', 'development'),
  ('development-css', 'CSS', 'development-css', 'CSS', 'development'),
  ('development-javascript', 'JavaScript', 'development-javascript', 'JavaScript', 'development'),
  ('development-components', 'Components', 'development-components', 'Components', 'development'),
  ('development-libraries', 'Libraries', 'development-libraries', 'Libraries', 'development'),
  ('development-apis', 'APIs', 'development-apis', 'APIs', 'development'),
  ('development-open-source', 'Open Source', 'development-open-source', 'Open Source', 'development'),
  ('development-ai-tools', 'AI Tools', 'development-ai-tools', 'AI Tools', 'development'),
  ('development-documentation', 'Documentation', 'development-documentation', 'Documentation', 'development'),
  ('design-ui-ux', 'UI/UX', 'design-ui-ux', 'UI/UX', 'design'),
  ('design-design-systems', 'Design Systems', 'design-design-systems', 'Design Systems', 'design'),
  ('design-typography', 'Typography', 'design-typography', 'Typography', 'design'),
  ('design-icons', 'Icons', 'design-icons', 'Icons', 'design'),
  ('design-colors', 'Colors', 'design-colors', 'Colors', 'design'),
  ('design-illustration', 'Illustration', 'design-illustration', 'Illustration', 'design'),
  ('design-3d', '3D', 'design-3d', '3D', 'design'),
  ('design-motion', 'Motion', 'design-motion', 'Motion', 'design'),
  ('design-branding', 'Branding', 'design-branding', 'Branding', 'design'),
  ('design-ai-design', 'AI Design', 'design-ai-design', 'AI Design', 'design'),
  ('design-inspiration', 'Inspiration', 'design-inspiration', 'Inspiration', 'design'),
  ('design-assets', 'Assets', 'design-assets', 'Assets', 'design')
on conflict (id) do nothing;

-- 7. Seed Tags Taxonomy
insert into public.tags (id, name, slug) values
  ('minimal', 'minimal', 'minimal'),
  ('free', 'free', 'free'),
  ('open-source', 'open-source', 'open-source'),
  ('figma', 'figma', 'figma'),
  ('react', 'react', 'react'),
  ('saas', 'saas', 'saas'),
  ('mobile', 'mobile', 'mobile'),
  ('web', 'web', 'web'),
  ('productivity', 'productivity', 'productivity'),
  ('typography', 'typography', 'typography'),
  ('icons', 'icons', 'icons'),
  ('animation', 'animation', 'animation'),
  ('3d', '3d', '3d'),
  ('ai', 'ai', 'ai'),
  ('design-system', 'design-system', 'design-system'),
  ('components', 'components', 'components'),
  ('css', 'css', 'css'),
  ('collaboration', 'collaboration', 'collaboration'),
  ('prototype', 'prototype', 'prototype'),
  ('photos', 'photos', 'photos'),
  ('color', 'color', 'color'),
  ('research', 'research', 'research'),
  ('illustration', 'illustration', 'illustration')
on conflict (id) do nothing;
