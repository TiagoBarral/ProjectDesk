-- ProjectDesk Supabase schema
-- Current phase: simple cross-device sync, no login/auth, no RLS, no realtime.
-- Later, when authentication is added, enable RLS and add owner-based policies.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  color text not null default '#5e5ce6',
  status text not null default 'active',
  pinned boolean not null default false,
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
  title text,
  description text not null default '',
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
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text,
  size_bytes bigint,
  date_label text,
  data_url text, -- legacy local-only uploads; new uploads use Supabase Storage metadata above.
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'ProjectDesk public read project files'
  ) then
    create policy "ProjectDesk public read project files"
      on storage.objects for select
      using (bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'ProjectDesk anonymous upload project files'
  ) then
    create policy "ProjectDesk anonymous upload project files"
      on storage.objects for insert
      with check (bucket_id = 'project-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'ProjectDesk anonymous update project files'
  ) then
    create policy "ProjectDesk anonymous update project files"
      on storage.objects for update
      using (bucket_id = 'project-files')
      with check (bucket_id = 'project-files');
  end if;
end $$;

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
