-- Let a document be attached to a specific case event (e.g. the scanned, signed
-- Zoom/attendance sheet sitting on its digital record). Still belongs to the
-- matter; case_event_id is the optional finer link. Cascades with the event.
alter table documents
  add column case_event_id uuid references case_events(id) on delete cascade;
create index documents_case_event_id_idx on documents(case_event_id);

-- The firm's appellate-file tab index (A–H) as document categories. Editable in
-- admin like any other. on conflict keeps re-runs / existing rows safe.
insert into document_categories (name, slug) values
  ('Check List & File Chronology',     'check-list-file-chronology'),
  ('Court / Zoom Attendance Sheet',    'court-zoom-attendance-sheet'),
  ('Notice of Appeal',                 'notice-of-appeal'),
  ('Petition of Appeal',               'petition-of-appeal'),
  ('Correspondence — Court',           'correspondence-court'),
  ('Correspondence — Prison',          'correspondence-prison'),
  ('Correspondence — Client',          'correspondence-client'),
  ('Personal Particulars',             'personal-particulars')
on conflict (slug) do nothing;
