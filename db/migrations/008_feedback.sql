-- AIX Vault: Migration 008 - Viewer Feedback & Feature Suggestions
-- Allows viewers to submit notes, tool suggestions, and feature requests.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Allow anyone (viewers, public) to submit feedback
create policy "Allow public feedback inserts"
  on public.feedback
  for insert
  to public
  with check (true);

-- Only admins can view or manage submitted feedback
create policy "Admins can view feedback"
  on public.feedback
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update feedback"
  on public.feedback
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete feedback"
  on public.feedback
  for delete
  to authenticated
  using (public.is_admin());
