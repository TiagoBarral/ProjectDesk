-- ProjectDesk private file bucket hardening
-- Run after authenticated Storage policies are installed and new upload/open
-- behavior has been verified from the app.

update storage.buckets
set public = false
where id = 'project-files';
