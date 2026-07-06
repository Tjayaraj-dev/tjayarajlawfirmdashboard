-- The firm's case-type file covers, a Courts reference list, and an appointment
-- type on matters (court-appointed vs client-appointed).

-- 1. Case types (drive the adaptive matter form via their slug).
insert into case_types (name, slug) values
  ('Criminal (Penal Code)',      'criminal-penal-code'),
  ('Civil (NCVC / NCVA)',        'civil-ncvc-ncva'),
  ('Committal — High Court',     'committal-high-court'),
  ('Committal — Lower Court',    'committal-lower-court')
on conflict (slug) do nothing;

-- 2. Courts — an editable lookup like case_types / document_categories.
create table courts (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);
alter table courts enable row level security;
grant select, insert, update, delete on courts to authenticated;
create policy courts_select on courts for select to authenticated using (true);
create policy courts_admin on courts for all to authenticated
  using (is_admin()) with check (is_admin());

insert into courts (name, slug) values
  ('Mahkamah Tinggi Alor Setar',     'mt-alor-setar'),
  ('Mahkamah Sesyen Alor Setar',     'ms-alor-setar'),
  ('Mahkamah Majistret Alor Setar',  'mm-alor-setar'),
  ('Mahkamah Tinggi Sungai Petani',  'mt-sungai-petani'),
  ('Mahkamah Sesyen Sungai Petani',  'ms-sungai-petani'),
  ('Mahkamah Majistret Sungai Petani','mm-sungai-petani'),
  ('Mahkamah Tinggi Kangar',         'mt-kangar'),
  ('Mahkamah Tinggi Butterworth',    'mt-butterworth'),
  ('Mahkamah Sesyen Butterworth',    'ms-butterworth'),
  ('Mahkamah Majistret Butterworth', 'mm-butterworth'),
  ('Mahkamah Majistret Bukit Mertajam','mm-bukit-mertajam'),
  ('Mahkamah Majistret Baling',      'mm-baling'),
  ('Mahkamah Majistret Gurun',       'mm-gurun'),
  ('Mahkamah Majistret Jitra',       'mm-jitra'),
  ('Mahkamah Tinggi Johor Bahru',    'mt-johor-bahru'),
  ('Mahkamah Tinggi Ipoh',           'mt-ipoh'),
  ('Mahkamah Rayuan Putrajaya (COA — Zoom)', 'coa-putrajaya')
on conflict (slug) do nothing;

-- 3. Appointment type on matters.
alter table matters add column appointment_type text;
