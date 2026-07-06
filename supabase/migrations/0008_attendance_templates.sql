-- New attendance-sheet templates surfaced after the client meeting:
-- a Civil court-attendance variant, Advisory Board (Dangerous Drugs Act 1985),
-- and Remand Proceeding. They extend the existing case_event_type so they slot
-- into the same events system (and the new firm-wide Attendance register).

alter type case_event_type add value if not exists 'civil_court_attendance';
alter type case_event_type add value if not exists 'advisory_board';
alter type case_event_type add value if not exists 'remand_proceeding';
