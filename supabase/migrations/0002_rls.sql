-- RLS policies + audit triggers. 0001 enabled RLS with no policies (deny-all);
-- this file grants the explicit, per-role access. admin/staff are BOTH the
-- Postgres `authenticated` role — the distinction is enforced in policies via
-- is_admin(), never via Postgres roles. anon gets nothing.

-- ---------------------------------------------------------------------------
-- Role helper. SECURITY DEFINER so it reads profiles bypassing RLS — this is
-- what prevents infinite recursion when is_admin() is used inside a policy
-- that is itself on the profiles table.
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- New auth.users row -> profile row (role defaults to staff; admin promoted
-- manually). SECURITY DEFINER so the signup path can write profiles.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'staff'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Audit trigger. Mutations on client data are logged here. Reads can't be
-- caught by a Postgres trigger (no SELECT triggers) — read-logging lives in
-- the server-action layer. SECURITY DEFINER so it can always insert into
-- audit_log regardless of the actor's policies.
-- ---------------------------------------------------------------------------
create or replace function log_audit()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'UPDATE' then
    if new.deleted_at is not null and old.deleted_at is null then
      v_action := 'soft_delete';
    elsif new.deleted_at is null and old.deleted_at is not null then
      v_action := 'restore';
    else
      v_action := 'update';
    end if;
  end if;

  insert into audit_log (actor_id, action, resource_type, resource_id, payload)
  values (
    auth.uid(),
    v_action,
    tg_table_name,
    new.id,
    to_jsonb(new) - 'updated_at'
  );
  return new;
end;
$$;

create trigger audit_clients     after insert or update on clients
  for each row execute function log_audit();
create trigger audit_matters     after insert or update on matters
  for each row execute function log_audit();
create trigger audit_case_events after insert or update on case_events
  for each row execute function log_audit();
create trigger audit_documents   after insert or update on documents
  for each row execute function log_audit();

-- ---------------------------------------------------------------------------
-- Grants. RLS sits on top of these; a row is only visible if BOTH the grant
-- and a permissive policy allow it. Note: NO delete grant on the data tables
-- => hard delete is impossible for everyone (soft-delete only, by construction).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;

-- Supabase default-grants broad privileges (incl. DELETE) to anon/authenticated
-- on new public tables. Revoke hard-delete explicitly so soft-delete-only holds
-- at the privilege level, not just because a DELETE policy is absent.
revoke delete on clients, matters, case_events, documents from authenticated, anon;

grant select, insert, update on clients, matters, case_events, documents to authenticated;
grant select, insert, update, delete on case_types, document_categories to authenticated;
grant select, insert on audit_log to authenticated;          -- append-only: no update/delete
grant select, update on firm_settings to authenticated;
grant select, insert, update on profiles to authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy profiles_insert on profiles for insert to authenticated
  with check (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------------
-- Data tables. Staff see live rows; admin sees everything incl. soft-deleted.
-- USING gates which rows you can target; because an already-deleted row fails
-- USING for staff, staff can soft-delete a live row but cannot restore one —
-- restore is admin-only. created_by/uploaded_by must stamp the actor.
-- ---------------------------------------------------------------------------
create policy clients_select on clients for select to authenticated
  using (deleted_at is null or is_admin());
create policy clients_insert on clients for insert to authenticated
  with check (created_by = auth.uid());
create policy clients_update on clients for update to authenticated
  using (deleted_at is null or is_admin())
  with check (true);

create policy matters_select on matters for select to authenticated
  using (deleted_at is null or is_admin());
create policy matters_insert on matters for insert to authenticated
  with check (created_by = auth.uid());
create policy matters_update on matters for update to authenticated
  using (deleted_at is null or is_admin())
  with check (true);

create policy case_events_select on case_events for select to authenticated
  using (deleted_at is null or is_admin());
create policy case_events_insert on case_events for insert to authenticated
  with check (created_by = auth.uid());
create policy case_events_update on case_events for update to authenticated
  using (deleted_at is null or is_admin())
  with check (true);

create policy documents_select on documents for select to authenticated
  using (deleted_at is null or is_admin());
create policy documents_insert on documents for insert to authenticated
  with check (uploaded_by = auth.uid());
create policy documents_update on documents for update to authenticated
  using (deleted_at is null or is_admin())
  with check (true);

-- ---------------------------------------------------------------------------
-- Lookups. Everyone reads; only admin writes.
-- ---------------------------------------------------------------------------
create policy case_types_select on case_types for select to authenticated using (true);
create policy case_types_admin  on case_types for all to authenticated
  using (is_admin()) with check (is_admin());

create policy doc_categories_select on document_categories for select to authenticated using (true);
create policy doc_categories_admin  on document_categories for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- audit_log — append-only. select for admin (the Bar Council answer to
-- "who saw this file"), insert for the app/triggers. No update/delete policy
-- AND no update/delete grant => immutable once written.
-- ---------------------------------------------------------------------------
create policy audit_select on audit_log for select to authenticated using (is_admin());
create policy audit_insert on audit_log for insert to authenticated with check (true);

-- ---------------------------------------------------------------------------
-- firm_settings — everyone reads, admin updates.
-- ---------------------------------------------------------------------------
create policy firm_settings_select on firm_settings for select to authenticated using (true);
create policy firm_settings_update on firm_settings for update to authenticated
  using (is_admin()) with check (is_admin());
