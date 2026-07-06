-- RLS proof. Run against the LOCAL stack once it's up:
--   supabase db reset            # applies 0001-0003 + seed fresh
--   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2 | tr -d '\"')" \
--        -f supabase/tests/rls_test.sql
--
-- Every check RAISEs on failure. Silence = fail-closed holds. Wrapped in a
-- transaction that ROLLBACKs, so it leaves no test data behind.

begin;

-- --- Fixtures: two users via the real signup path (trigger makes profiles) ---
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-00000000a001', 'admin@test.local',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000a002', 'staff@test.local',  'authenticated', 'authenticated');

update profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000a001';

-- A live client and a soft-deleted client, both owned by admin.
insert into clients (id, name, created_by)
values ('00000000-0000-0000-0000-0000000c0001', 'Live Client', '00000000-0000-0000-0000-00000000a001');
insert into clients (id, name, created_by, deleted_at)
values ('00000000-0000-0000-0000-0000000c0002', 'Deleted Client', '00000000-0000-0000-0000-00000000a001', now());

-- Helper to run a check as a given user under the authenticated role.
create or replace function _as(uid text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end; $$;

create or replace function _reset() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
end; $$;

do $$
declare n int;
begin
  -- 1. ANON sees no clients (deny-by-default).
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*) into n from clients;
  if n <> 0 then raise exception 'FAIL: anon saw % clients (expected 0)', n; end if;
  perform _reset();

  -- 2. STAFF sees the live client but NOT the soft-deleted one.
  perform _as('00000000-0000-0000-0000-00000000a002');
  select count(*) into n from clients;
  if n <> 1 then raise exception 'FAIL: staff saw % clients (expected 1, deleted hidden)', n; end if;
  perform _reset();

  -- 3. ADMIN sees both live and soft-deleted.
  perform _as('00000000-0000-0000-0000-00000000a001');
  select count(*) into n from clients;
  if n <> 2 then raise exception 'FAIL: admin saw % clients (expected 2)', n; end if;
  perform _reset();

  -- 4. STAFF cannot read the audit log; ADMIN can.
  perform _as('00000000-0000-0000-0000-00000000a002');
  select count(*) into n from audit_log;
  if n <> 0 then raise exception 'FAIL: staff read % audit rows (expected 0)', n; end if;
  perform _reset();

  perform _as('00000000-0000-0000-0000-00000000a001');
  select count(*) into n from audit_log;        -- inserts above generated audit rows
  if n = 0 then raise exception 'FAIL: admin saw 0 audit rows (expected > 0)'; end if;
  perform _reset();

  raise notice 'ALL RLS CHECKS PASSED';
end $$;

-- 5. Hard delete must be impossible even for admin. Two ways it can be blocked:
-- a privilege error (delete revoked) or a silent 0-row delete (no delete policy).
-- Since migration 0005, ADMINS may hard-delete (see 0005_admin_hard_delete),
-- so the invariant now is that STAFF cannot. Run the delete as staff (a002)
-- and assert the row survives. Admin hard-delete is exercised separately.
do $$
declare survived int;
begin
  perform _as('00000000-0000-0000-0000-00000000a002');  -- staff
  begin
    delete from clients where id = '00000000-0000-0000-0000-0000000c0001';
  exception
    when insufficient_privilege then null;
  end;
  perform _reset();
  select count(*) into survived from clients where id = '00000000-0000-0000-0000-0000000c0001';
  if survived <> 1 then
    raise exception 'FAIL: staff hard-deleted a client (expected it to survive)';
  end if;
  raise notice 'STAFF HARD-DELETE DENIAL PASSED';
end $$;

drop function _as(text);
drop function _reset();

rollback;
