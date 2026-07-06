-- Defence Case portfolio: a witness list, an exhibit list, and the defence
-- file-index document tabs. Witnesses/exhibits mirror the security posture of
-- the other data tables (fail-closed RLS, audit, read-only enforcement,
-- soft-delete only, cascade with the matter).

create table witnesses (
  id            uuid primary key default gen_random_uuid(),
  matter_id     uuid not null references matters(id) on delete cascade,
  name          text not null,
  role          text,               -- peranan dalam kes
  date_presented date,              -- tarikh keterangan dikemuka
  status        text,               -- status saksi
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index witnesses_matter_id_idx on witnesses(matter_id);

create table exhibits (
  id             uuid primary key default gen_random_uuid(),
  matter_id      uuid not null references matters(id) on delete cascade,
  marking        text,              -- P / ID / D
  date_presented date,
  through_witness text,             -- dikemuka melalui saksi
  description    text,
  created_by     uuid references profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index exhibits_matter_id_idx on exhibits(matter_id);

-- Triggers: updated_at, audit, read-only enforcement (functions already exist).
create trigger witnesses_updated_at before update on witnesses
  for each row execute function set_updated_at();
create trigger exhibits_updated_at before update on exhibits
  for each row execute function set_updated_at();
create trigger witnesses_writable before insert or update or delete on witnesses
  for each row execute function enforce_writable();
create trigger exhibits_writable before insert or update or delete on exhibits
  for each row execute function enforce_writable();
create trigger audit_witnesses after insert or update on witnesses
  for each row execute function log_audit();
create trigger audit_exhibits after insert or update on exhibits
  for each row execute function log_audit();

-- RLS: fail-closed, soft-delete only (no delete grant).
alter table witnesses enable row level security;
alter table exhibits  enable row level security;
revoke delete on witnesses, exhibits from authenticated, anon;
grant select, insert, update on witnesses, exhibits to authenticated;

create policy witnesses_select on witnesses for select to authenticated
  using (deleted_at is null or is_admin());
create policy witnesses_insert on witnesses for insert to authenticated
  with check (created_by = auth.uid());
create policy witnesses_update on witnesses for update to authenticated
  using (deleted_at is null or is_admin()) with check (true);

create policy exhibits_select on exhibits for select to authenticated
  using (deleted_at is null or is_admin());
create policy exhibits_insert on exhibits for insert to authenticated
  with check (created_by = auth.uid());
create policy exhibits_update on exhibits for update to authenticated
  using (deleted_at is null or is_admin()) with check (true);

-- Defence file-index document tabs (the "51B" index). Witness/exhibit lists are
-- their own tables above, so they are not categories here.
insert into document_categories (name, slug) values
  ('51A',                                  'def-51a'),
  ('51B',                                  'def-51b'),
  ('Note Book',                            'def-note-book'),
  ('Photos (Original)',                    'def-photos'),
  ('Original Copy 51A',                    'def-original-51a'),
  ('Additional Prosecution Documents',     'def-prosecution-additional'),
  ('Prosecution Witness Statements',       'def-prosecution-statements'),
  ('Defence Witness Statements',           'def-defence-statements'),
  ('Client Interview & Personal Documents','def-client-personal'),
  ('Notices (Siasatan / Alcontara / Akuan / Alibi)', 'def-notices'),
  ('File A',                               'def-file-a'),
  ('File B — Submissions (Hujahan)',       'def-file-b-submissions'),
  ('File B — Authorities (Autoriti)',      'def-file-b-authorities'),
  ('File B — Mitigation (Rayuan Mitigasi)','def-file-b-mitigation'),
  ('Other Documents (Defence)',            'def-other')
on conflict (slug) do nothing;
