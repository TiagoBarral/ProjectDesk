alter table tasks add column if not exists title text;
alter table tasks add column if not exists description text;
update tasks set title = text where title is null;
