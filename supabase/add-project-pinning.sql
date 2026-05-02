-- ProjectDesk project pinning migration
-- Run this once in the Supabase SQL editor before testing pinned project sync.

alter table public.projects
  add column if not exists pinned boolean not null default false;
