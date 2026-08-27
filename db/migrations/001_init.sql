-- AIX Vault schema for Supabase PostgreSQL
-- Apply in the SQL editor or via the CLI when connecting a project.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  parent_id uuid references public.categories(id),
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  url text not null,
  domain text not null,
  icon_url text,
  type text not null,
  category_id uuid references public.categories(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_public boolean not null default true
);

create unique index if not exists resources_url_key on public.resources (url);
create index if not exists resources_name_idx on public.resources using gin (to_tsvector('simple', name));
create index if not exists resources_description_idx on public.resources using gin (to_tsvector('simple', coalesce(description, '')));
create index if not exists resources_domain_idx on public.resources (domain);
create index if not exists resources_type_idx on public.resources (type);
create index if not exists resources_category_idx on public.resources (category_id);

create table if not exists public.resource_tags (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (resource_id, tag_id)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  icon text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_resources (
  collection_id uuid not null references public.collections(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, resource_id)
);

create table if not exists public.saved_resources (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.resources enable row level security;
alter table public.resource_tags enable row level security;
alter table public.collections enable row level security;
alter table public.collection_resources enable row level security;
alter table public.saved_resources enable row level security;

create policy "public read categories" on public.categories for select using (true);
create policy "public read tags" on public.tags for select using (true);
create policy "public read public resources" on public.resources
  for select using (is_public = true or created_by = auth.uid());
create policy "owners insert resources" on public.resources
  for insert with check (auth.uid() = created_by);
create policy "owners update resources" on public.resources
  for update using (auth.uid() = created_by);
create policy "owners delete resources" on public.resources
  for delete using (auth.uid() = created_by);

create policy "public read resource tags" on public.resource_tags for select using (true);
create policy "owners write resource tags" on public.resource_tags
  for all using (
    exists (
      select 1 from public.resources r
      where r.id = resource_id and r.created_by = auth.uid()
    )
  );

create policy "read collections" on public.collections
  for select using (created_by = auth.uid() or created_by is null);
create policy "owners write collections" on public.collections
  for all using (auth.uid() = created_by);

create policy "read collection resources" on public.collection_resources for select using (true);
create policy "owners write collection resources" on public.collection_resources
  for all using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.created_by = auth.uid()
    )
  );

create policy "users read own saved" on public.saved_resources
  for select using (auth.uid() = user_id);
create policy "users write own saved" on public.saved_resources
  for all using (auth.uid() = user_id);
