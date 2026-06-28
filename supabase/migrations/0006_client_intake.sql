-- Richer client intake: an auto-assigned Client ID, an old-file reference, and
-- split contact fields (phone / email / address). Case type + details captured
-- at intake create the client's first matter, so the case is a real file from
-- the start (and shows on the calendar, holds documents, etc.).

-- Auto Client ID, e.g. TJC-C-0001. Backfill existing rows, then default new ones.
create sequence if not exists client_code_seq start 1;
alter table clients add column client_code text;
update clients
  set client_code = 'TJC-C-' || lpad(nextval('client_code_seq')::text, 4, '0')
  where client_code is null;
alter table clients
  alter column client_code set default ('TJC-C-' || lpad(nextval('client_code_seq')::text, 4, '0'));
alter table clients add constraint clients_client_code_key unique (client_code);

-- Old / existing file reference, and split contact fields.
alter table clients add column reference_no text;
alter table clients add column phone text;
alter table clients add column email text;

-- contact was a single free-form field; phone/email/address replace it.
alter table clients drop column contact;

-- A free-text case description, set at intake or on the matter form.
alter table matters add column description text;
