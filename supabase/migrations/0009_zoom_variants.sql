-- Zoom gets its own section with three template variants (appellate court,
-- trial/committal court, remand), matching the firm's Zoom Session sheets.
-- The old generic 'zoom_attendance' value stays in the enum (Postgres can't
-- drop enum values) but is retired from the app config.

alter type case_event_type add value if not exists 'zoom_appellate';
alter type case_event_type add value if not exists 'zoom_trial';
alter type case_event_type add value if not exists 'zoom_remand';
