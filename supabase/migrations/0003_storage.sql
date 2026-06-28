-- Document storage. Private bucket — there are NO public URLs by design; every
-- download goes through a server-generated signed URL after an access check.
-- Object paths are namespaced by matter: documents/<matter_id>/<filename>.
-- Old versions are never removed (versioning + malpractice retention), so there
-- is deliberately no DELETE policy on objects.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents');

create policy "documents insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents');

create policy "documents update" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents');
