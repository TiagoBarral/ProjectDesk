-- ProjectDesk persistent file uploads
-- Current phase: no login/auth yet. This uses a public Storage bucket and
-- permissive anon upload policies. Tighten this with Supabase Auth + RLS later.

alter table public.files add column if not exists storage_bucket text;
alter table public.files add column if not exists storage_path text;
alter table public.files add column if not exists public_url text;
alter table public.files add column if not exists mime_type text;
alter table public.files add column if not exists size_bytes bigint;
alter table public.files add column if not exists date_label text;
alter table public.files add column if not exists updated_at timestamptz not null default now();
alter table public.files add column if not exists deleted_at timestamptz;

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
