-- Permanent (hard) delete, ADMIN ONLY. This intentionally overrides the
-- soft-delete-only default, at the firm's explicit request. It stays
-- fail-closed: only is_admin() may delete; staff still cannot. Every permanent
-- deletion is written to audit_log by the server action before the row goes.

-- Re-grant DELETE (revoked in 0002) and gate it to admins via policy.
grant delete on clients, matters, case_events, documents to authenticated;

create policy clients_delete on clients
  for delete to authenticated using (is_admin());
create policy matters_delete on matters
  for delete to authenticated using (is_admin());
create policy case_events_delete on case_events
  for delete to authenticated using (is_admin());
create policy documents_delete on documents
  for delete to authenticated using (is_admin());

-- Admins may remove the underlying storage objects too.
create policy "documents delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_admin());

-- Cascade so deleting a parent removes its children in one operation.
-- (Storage objects are purged separately in the server action before delete.)
alter table matters
  drop constraint matters_client_id_fkey,
  add constraint matters_client_id_fkey
    foreign key (client_id) references clients(id) on delete cascade;

alter table case_events
  drop constraint case_events_matter_id_fkey,
  add constraint case_events_matter_id_fkey
    foreign key (matter_id) references matters(id) on delete cascade;

alter table documents
  drop constraint documents_matter_id_fkey,
  add constraint documents_matter_id_fkey
    foreign key (matter_id) references matters(id) on delete cascade;
