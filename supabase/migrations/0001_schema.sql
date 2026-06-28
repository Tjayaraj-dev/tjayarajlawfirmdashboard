-- T. Jayaraj Law Dashboard — Module 1 schema (Client Vault + Case Events)
-- RLS is ENABLED on every table at the bottom of this file with NO policies,
-- which is deny-all (fail-closed). Policies land in 0002_rls.sql.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role     as enum ('admin', 'staff');
create type client_type   as enum ('individual', 'corporate');
create type matter_status as enum ('active', 'on_hold', 'pending_filing', 'closed');

-- The five physical forms the firm hands counsel. Each is a case_event; the
-- type-specific fields live in case_events.details (jsonb).
create type case_event_type as enum (
  'court_attendance',
  'zoom_attendance',
  'prison_attendance',
  'client_interview',
  'minutes_of_proceedings'
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'staff',
  full_name  text not null,
  email      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Editable lookups
-- ---------------------------------------------------------------------------
-- Starts empty; populated via admin UI once practice-area taxonomy is confirmed.
create table case_types (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- Seeded with the 6 universal defaults in seed.sql.
create table document_categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  type            client_type not null default 'individual',
  ic_or_company_no text,                 -- NRIC (new/old) or SSM company no.
  contact         text,                  -- office / house / cellular, free-form
  address         text,
  custom_fields   jsonb not null default '{}',
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz            -- soft-delete only
);
create trigger clients_updated_at before update on clients
  for each row execute function set_updated_at();
create index clients_deleted_at_idx on clients(deleted_at);

-- ---------------------------------------------------------------------------
-- matters — the case file (TJC Ref)
-- ---------------------------------------------------------------------------
-- file_ref is the firm's internal TJC reference (e.g. TJC/CRM/2025/014).
-- case_no is the COURT's case number — distinct, and criminal files often
-- carry committal + trial numbers, so case_no_committal/trial are separate.
create table matters (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients(id),
  file_ref         text not null unique,
  title            text not null,
  case_type_id     uuid references case_types(id),
  status           matter_status not null default 'active',
  opened_at        date not null default current_date,
  next_hearing_at  timestamptz,          -- drives the calendar; mirrors latest "next date"
  -- Criminal-practice fields that recur across the attendance forms:
  court            text,
  case_no_committal text,
  case_no_trial    text,
  accused          text,                 -- accused name(s)
  charges          text,
  prosecutor_dpp   text,                 -- DPP / prosecutor
  -- Civil/other fields kept from the original plan:
  opposing_counsel text,
  assigned_to      uuid references profiles(id),
  custom_fields    jsonb not null default '{}',
  created_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create trigger matters_updated_at before update on matters
  for each row execute function set_updated_at();
create index matters_client_id_idx       on matters(client_id);
create index matters_next_hearing_at_idx on matters(next_hearing_at);
create index matters_deleted_at_idx      on matters(deleted_at);

-- ---------------------------------------------------------------------------
-- case_events — the five attendance / proceeding forms
-- ---------------------------------------------------------------------------
-- Shared spine across all five forms: date, counsel, coram, "set for",
-- next date, notes. Everything form-specific (prosecutor, prison purpose,
-- fees, witness, NRIC, venue, contacts, minutes rows) goes in details jsonb.
create table case_events (
  id          uuid primary key default gen_random_uuid(),
  matter_id   uuid not null references matters(id),
  event_type  case_event_type not null,
  occurred_at timestamptz not null,      -- "Date / Time" on the form
  counsel     text,
  coram       text,                      -- changes per appearance, so event-level
  set_for     text,                      -- purpose of this appearance
  next_date   date,                      -- "Next date(s)" — feeds the calendar
  next_set_for text,
  notes       text,                      -- "Matters Transpired" + "Notes/Remarks"
  details     jsonb not null default '{}',
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger case_events_updated_at before update on case_events
  for each row execute function set_updated_at();
create index case_events_matter_id_idx  on case_events(matter_id);
create index case_events_next_date_idx  on case_events(next_date);
create index case_events_occurred_at_idx on case_events(occurred_at);
create index case_events_deleted_at_idx on case_events(deleted_at);

-- ---------------------------------------------------------------------------
-- documents — versioned, signed-URL only
-- ---------------------------------------------------------------------------
create table documents (
  id           uuid primary key default gen_random_uuid(),
  matter_id    uuid not null references matters(id),
  category_id  uuid references document_categories(id),
  filename     text not null,
  storage_path text not null,
  version      int not null default 1,   -- re-upload of same filename = new row, version+1
  mime_type    text,
  file_size    bigint,
  uploaded_by  uuid references profiles(id),
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index documents_matter_id_idx  on documents(matter_id);
create index documents_deleted_at_idx on documents(deleted_at);

-- ---------------------------------------------------------------------------
-- audit_log — append-only (enforced in 0002_rls.sql: no update/delete grants)
-- ---------------------------------------------------------------------------
create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references profiles(id),
  action        text not null,           -- e.g. 'read', 'create', 'update', 'soft_delete'
  resource_type text not null,           -- 'client' | 'matter' | 'document' | ...
  resource_id   uuid,
  payload       jsonb not null default '{}',
  at            timestamptz not null default now()
);
create index audit_log_resource_idx on audit_log(resource_type, resource_id);
create index audit_log_actor_idx    on audit_log(actor_id);
create index audit_log_at_idx       on audit_log(at);

-- ---------------------------------------------------------------------------
-- firm_settings — singleton
-- ---------------------------------------------------------------------------
create table firm_settings (
  id              boolean primary key default true,  -- singleton guard: only one row (true)
  name            text not null default 'T. Jayaraj & Company',
  bar_council_no  text,
  logo_url        text,
  primary_hex     text default '#1e3a5f',
  sender_email    text,
  retention_years int not null default 7,            -- Bar Council Malaysia default
  updated_at      timestamptz not null default now(),
  constraint firm_settings_singleton check (id = true)
);
create trigger firm_settings_updated_at before update on firm_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Fail-closed: enable RLS everywhere. No policies yet => deny all.
-- Policies are added per-role in 0002_rls.sql.
-- ---------------------------------------------------------------------------
alter table profiles            enable row level security;
alter table case_types          enable row level security;
alter table document_categories enable row level security;
alter table clients             enable row level security;
alter table matters             enable row level security;
alter table case_events         enable row level security;
alter table documents           enable row level security;
alter table audit_log           enable row level security;
alter table firm_settings       enable row level security;
