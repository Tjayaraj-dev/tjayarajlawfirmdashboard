-- Emergency Read-Only Mode (proposal: Phase 3 "read-only emergency mode").
-- When firm_settings.read_only is true, all writes to the data tables are
-- blocked at the database for EVERYONE — including admins — so the freeze is
-- absolute. Toggling the flag lives on firm_settings (not guarded here), so an
-- admin can always lift the freeze. Reads (and their download audit) continue.

alter table firm_settings add column read_only boolean not null default false;

create or replace function enforce_writable()
returns trigger
language plpgsql as $$
begin
  if (select read_only from firm_settings where id = true) then
    raise exception 'The system is in read-only (emergency) mode. Changes are disabled.'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger clients_writable
  before insert or update or delete on clients
  for each row execute function enforce_writable();
create trigger matters_writable
  before insert or update or delete on matters
  for each row execute function enforce_writable();
create trigger case_events_writable
  before insert or update or delete on case_events
  for each row execute function enforce_writable();
create trigger documents_writable
  before insert or update or delete on documents
  for each row execute function enforce_writable();
