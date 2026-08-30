update storage.buckets
set file_size_limit = 52428800
where id = 'documents';

create policy "document owners delete failed uploads" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and owner_id = (select auth.uid()::text));
