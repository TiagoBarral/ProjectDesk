-- ProjectDesk auth/RLS migration.
-- Run this after enabling Supabase Email/Password Auth and creating your first user.
--
-- Existing pre-auth rows will have null user_id and will be hidden by RLS.

alter table public.projects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.tasks
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.subtasks
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.files
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_project_idx on public.tasks(user_id, project_id);
create index if not exists subtasks_user_id_idx on public.subtasks(user_id);
create index if not exists subtasks_user_task_idx on public.subtasks(user_id, task_id);
create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_user_project_idx on public.files(user_id, project_id);

-- Optional one-time pre-auth data claim:
-- After the user_id columns exist, replace the UUID below with the Supabase
-- Auth user id that should own existing rows, then run this block before
-- relying on the app with RLS.
--
-- do $$
-- declare
--   owner_id uuid := '00000000-0000-0000-0000-000000000000';
-- begin
--   update public.projects set user_id = owner_id where user_id is null;
--   update public.tasks set user_id = owner_id where user_id is null;
--   update public.subtasks set user_id = owner_id where user_id is null;
--   update public.files set user_id = owner_id where user_id is null;
-- end $$;

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.files enable row level security;

drop policy if exists "ProjectDesk users can read own projects" on public.projects;
drop policy if exists "ProjectDesk users can insert own projects" on public.projects;
drop policy if exists "ProjectDesk users can update own projects" on public.projects;
drop policy if exists "ProjectDesk users can delete own projects" on public.projects;

create policy "ProjectDesk users can read own projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "ProjectDesk users can insert own projects"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "ProjectDesk users can update own projects"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "ProjectDesk users can delete own projects"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ProjectDesk users can read own tasks" on public.tasks;
drop policy if exists "ProjectDesk users can insert own tasks" on public.tasks;
drop policy if exists "ProjectDesk users can update own tasks" on public.tasks;
drop policy if exists "ProjectDesk users can delete own tasks" on public.tasks;

create policy "ProjectDesk users can read own tasks"
  on public.tasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "ProjectDesk users can insert own tasks"
  on public.tasks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can update own tasks"
  on public.tasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = tasks.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can delete own tasks"
  on public.tasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ProjectDesk users can read own subtasks" on public.subtasks;
drop policy if exists "ProjectDesk users can insert own subtasks" on public.subtasks;
drop policy if exists "ProjectDesk users can update own subtasks" on public.subtasks;
drop policy if exists "ProjectDesk users can delete own subtasks" on public.subtasks;

create policy "ProjectDesk users can read own subtasks"
  on public.subtasks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "ProjectDesk users can insert own subtasks"
  on public.subtasks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.tasks
      where tasks.id = subtasks.task_id
        and tasks.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can update own subtasks"
  on public.subtasks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.tasks
      where tasks.id = subtasks.task_id
        and tasks.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can delete own subtasks"
  on public.subtasks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ProjectDesk users can read own files" on public.files;
drop policy if exists "ProjectDesk users can insert own files" on public.files;
drop policy if exists "ProjectDesk users can update own files" on public.files;
drop policy if exists "ProjectDesk users can delete own files" on public.files;

create policy "ProjectDesk users can read own files"
  on public.files for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "ProjectDesk users can insert own files"
  on public.files for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = files.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can update own files"
  on public.files for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.projects
      where projects.id = files.project_id
        and projects.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can delete own files"
  on public.files for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "ProjectDesk public read project files" on storage.objects;
drop policy if exists "ProjectDesk anonymous upload project files" on storage.objects;
drop policy if exists "ProjectDesk anonymous update project files" on storage.objects;

drop policy if exists "ProjectDesk users can read own storage files" on storage.objects;
drop policy if exists "ProjectDesk users can upload own storage files" on storage.objects;
drop policy if exists "ProjectDesk users can update own storage files" on storage.objects;
drop policy if exists "ProjectDesk users can delete own storage files" on storage.objects;

create policy "ProjectDesk users can read own storage files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "ProjectDesk users can upload own storage files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "ProjectDesk users can update own storage files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "ProjectDesk users can delete own storage files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Keep the existing bucket public until any pre-auth objects using legacy
-- paths like projects/<project-id>/... have been migrated or accepted as old
-- public links. After verifying current file uploads still open, make the
-- bucket private:
--
-- update storage.buckets
-- set public = false
-- where id = 'project-files';
