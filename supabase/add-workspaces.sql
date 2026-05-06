-- ProjectDesk workspace/profile foundation.
-- Run after supabase/add-auth-rls.sql.
--
-- This keeps ProjectDesk as a single-user personal workspace today, while
-- preparing the data model for future workspace membership.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Personal Workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.projects
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.tasks
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.subtasks
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.files
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists workspaces_owner_user_id_idx on public.workspaces(owner_user_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists projects_workspace_id_idx on public.projects(workspace_id);
create index if not exists tasks_workspace_id_idx on public.tasks(workspace_id);
create index if not exists subtasks_workspace_id_idx on public.subtasks(workspace_id);
create index if not exists files_workspace_id_idx on public.files(workspace_id);

-- Optional one-time migration for pre-workspace ProjectDesk data.
-- Replace owner_id and owner_email with your Supabase Auth user details, then
-- run this block to create/claim a personal workspace and attach existing rows.
--
-- do $$
-- declare
--   owner_id uuid := '00000000-0000-0000-0000-000000000000';
--   owner_email text := 'you@example.com';
--   target_workspace_id uuid;
-- begin
--   insert into public.profiles (id, email)
--   values (owner_id, owner_email)
--   on conflict (id) do update set email = excluded.email;
--
--   select workspace_id into target_workspace_id
--   from public.workspace_members
--   where user_id = owner_id
--   limit 1;
--
--   if target_workspace_id is null then
--     insert into public.workspaces (owner_user_id, name)
--     values (owner_id, 'Personal Workspace')
--     returning id into target_workspace_id;
--
--     insert into public.workspace_members (workspace_id, user_id, role)
--     values (target_workspace_id, owner_id, 'owner')
--     on conflict (workspace_id, user_id) do nothing;
--   end if;
--
--   update public.projects
--   set workspace_id = target_workspace_id
--   where user_id = owner_id and workspace_id is null;
--
--   update public.tasks
--   set workspace_id = target_workspace_id
--   where user_id = owner_id and workspace_id is null;
--
--   update public.subtasks
--   set workspace_id = target_workspace_id
--   where user_id = owner_id and workspace_id is null;
--
--   update public.files
--   set workspace_id = target_workspace_id
--   where user_id = owner_id and workspace_id is null;
-- end $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "ProjectDesk users can read own profile" on public.profiles;
drop policy if exists "ProjectDesk users can insert own profile" on public.profiles;
drop policy if exists "ProjectDesk users can update own profile" on public.profiles;

create policy "ProjectDesk users can read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "ProjectDesk users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "ProjectDesk users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "ProjectDesk users can read member workspaces" on public.workspaces;
drop policy if exists "ProjectDesk users can create own workspaces" on public.workspaces;
drop policy if exists "ProjectDesk owners can update workspaces" on public.workspaces;

create policy "ProjectDesk users can read member workspaces"
  on public.workspaces for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk users can create own workspaces"
  on public.workspaces for insert
  to authenticated
  with check ((select auth.uid()) = owner_user_id);

create policy "ProjectDesk owners can update workspaces"
  on public.workspaces for update
  to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists "ProjectDesk users can read own memberships" on public.workspace_members;
drop policy if exists "ProjectDesk owners can insert memberships" on public.workspace_members;
drop policy if exists "ProjectDesk owners can update memberships" on public.workspace_members;

create policy "ProjectDesk users can read own memberships"
  on public.workspace_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "ProjectDesk owners can insert memberships"
  on public.workspace_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_user_id = (select auth.uid())
    )
  );

create policy "ProjectDesk owners can update memberships"
  on public.workspace_members for update
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_user_id = (select auth.uid())
    )
  );
