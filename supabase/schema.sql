-- ProjectDesk Supabase schema
-- Current phase: simple cross-device sync, no login/auth, no RLS, no realtime.
-- Later, when authentication is added, enable RLS and add owner-based policies.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  color text not null default '#5e5ce6',
  status text not null default 'active',
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  text text not null,
  priority text not null default 'mid',
  importance text not null default 'medium',
  done boolean not null default false,
  expanded boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  kind text not null default 'link',
  path text,
  mime_type text,
  size_bytes bigint,
  date_label text,
  data_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_subtasks_updated_at on public.subtasks;
create trigger set_subtasks_updated_at
  before update on public.subtasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_files_updated_at on public.files;
create trigger set_files_updated_at
  before update on public.files
  for each row execute function public.set_updated_at();
