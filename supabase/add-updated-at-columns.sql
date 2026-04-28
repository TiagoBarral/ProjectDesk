alter table projects add column if not exists updated_at timestamptz;
alter table tasks add column if not exists updated_at timestamptz;
