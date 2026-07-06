// The five physical forms the firm hands counsel. Each maps to a case_event.
// Fields flagged `detail` land in the details jsonb; the rest are real columns
// on case_events (the shared spine: occurred_at, counsel, coram, set_for,
// next_date, next_set_for, notes).

export type CaseEventType =
  | 'court_attendance'
  | 'civil_court_attendance'
  | 'prison_attendance'
  | 'advisory_board'
  | 'remand_proceeding'
  | 'client_interview'
  | 'minutes_of_proceedings'
  | 'zoom_appellate'
  | 'zoom_trial'
  | 'zoom_remand'

export type FieldInput = 'text' | 'textarea' | 'date' | 'datetime' | 'time'

export type FieldDef = {
  key: string
  label: string
  input: FieldInput
  detail?: boolean // true => details jsonb; otherwise a shared column
  placeholder?: string
  half?: boolean // render two-up on wider screens
}

export type EventTypeConfig = {
  type: CaseEventType
  label: string
  blurb: string
  fields: FieldDef[]
}

const SHARED = {
  occurred_at: (label = 'Date & time'): FieldDef => ({ key: 'occurred_at', label, input: 'datetime', half: true }),
  counsel: (label = 'Counsel'): FieldDef => ({ key: 'counsel', label, input: 'text', half: true }),
  coram: (label = 'Coram'): FieldDef => ({ key: 'coram', label, input: 'text', half: true }),
  set_for: (label = 'Set for'): FieldDef => ({ key: 'set_for', label, input: 'text', half: true }),
  next_date: (label = 'Next date'): FieldDef => ({ key: 'next_date', label, input: 'date', half: true }),
  next_set_for: (): FieldDef => ({ key: 'next_set_for', label: 'Next — set for', input: 'text', half: true }),
  notes: (label = 'Notes / remarks'): FieldDef => ({ key: 'notes', label, input: 'textarea' }),
  // The "Notes / Remarks / Instructions" box present on every firm form.
  instructions: (): FieldDef => ({ key: 'instructions', label: 'Notes / remarks / instructions', input: 'textarea', detail: true }),
}

const d = (key: string, label: string, input: FieldInput = 'text', half = true): FieldDef => ({
  key,
  label,
  input,
  detail: true,
  half,
})

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    type: 'court_attendance',
    label: 'Court attendance (criminal)',
    blurb: 'Attendance before a trial / committal court.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram(),
      d('prosecutor', 'Prosecutor'),
      d('other_counsels', 'Other counsels'),
      d('email_cellular', 'Email / cellular'),
      SHARED.set_for(),
      SHARED.next_date('Next date(s)'),
      SHARED.next_set_for(),
      SHARED.notes('Matters transpired in court'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'civil_court_attendance',
    label: 'Court attendance (civil)',
    blurb: 'Attendance before a civil court.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram(),
      d('opponent', 'Opponent'),
      d('opponent_counsel', 'Opponent counsel'),
      d('email', 'Email'),
      d('cellular', 'Cellular'),
      SHARED.set_for(),
      SHARED.next_date('Next date / set for'),
      SHARED.notes('Special instructions'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'advisory_board',
    label: 'Advisory Board (Dangerous Drugs Act 1985)',
    blurb: 'Representation to the Advisory Board (Special Preventive Measures).',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram('Coram (1)'),
      d('coram_2', 'Coram (2)'),
      d('coram_3', 'Coram (3)'),
      d('venue', 'Venue'),
      SHARED.set_for(),
      d('proceeding_commence', 'Proceeding — commence', 'time'),
      d('proceeding_end', 'Proceeding — end', 'time'),
      d('client_1', 'Client 1'),
      d('client_1_abt', 'Client 1 — ABT'),
      d('client_2', 'Client 2'),
      d('client_2_abt', 'Client 2 — ABT'),
      SHARED.next_date(),
      SHARED.notes('Matters transpired during proceeding'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'remand_proceeding',
    label: 'Remand proceeding',
    blurb: 'Attendance at a remand proceeding.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram(),
      d('place_of_proceeding', 'Place of proceeding'),
      d('remand_case_no', 'Remand case no.'),
      d('suspect', 'Suspect(s)'),
      d('officer', 'Officer'),
      d('department', 'Department'),
      d('other_counsels', 'Other counsels'),
      d('remand_details', 'Remand details', 'textarea', false),
      SHARED.next_date('Next date(s)'),
      SHARED.notes('Matters transpired in court'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'zoom_appellate',
    label: 'Zoom session (appellate court)',
    blurb: 'Remote Zoom attendance before an appellate court.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram(),
      d('appellant', 'Appellant(s)'),
      d('email', 'Email'),
      d('prosecutor', 'Prosecutor'),
      d('other_counsels', 'Other counsel'),
      d('trial_court_case_no', 'Trial court case no.'),
      SHARED.set_for(),
      SHARED.next_date('Next date(s)'),
      SHARED.next_set_for(),
      SHARED.notes('Matters transpired during Zoom session'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'zoom_trial',
    label: 'Zoom session (trial / committal court)',
    blurb: 'Remote Zoom attendance before a trial / committal court.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram(),
      d('accused', 'Accused(s)'),
      d('prosecutor', 'Prosecutor'),
      d('email_cellular', 'Email / cellular'),
      d('other_counsels', 'Other counsels'),
      SHARED.set_for(),
      SHARED.next_date('Next date(s)'),
      SHARED.next_set_for(),
      SHARED.notes('Matters transpired in court'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'zoom_remand',
    label: 'Zoom session — remand',
    blurb: 'Remote Zoom attendance at a remand proceeding.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel(),
      SHARED.coram(),
      d('place_of_proceeding', 'Place of proceeding'),
      d('remand_case_no', 'Remand case no.'),
      d('suspect', 'Suspect(s)'),
      d('officer', 'Officer'),
      d('department', 'Department'),
      d('other_counsels', 'Other counsels'),
      d('remand_details', 'Remand details', 'textarea', false),
      SHARED.next_date('Next date(s)'),
      SHARED.notes('Matters transpired in court'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'prison_attendance',
    label: 'Prison attendance',
    blurb: 'Visit to a client / witness in prison.',
    fields: [
      SHARED.occurred_at('Visit date & time'),
      SHARED.counsel(),
      d('prison', 'Prison'),
      d('representative', 'Representative'),
      d('purpose_of_visit', 'Purpose of visit'),
      d('type_of_appointment', 'Appointment (pre / post)'),
      d('total_professional_fees', 'Total professional fees'),
      d('payment_made_to_date', 'Payment made to date'),
      d('witness_name', 'Witness name'),
      d('witness_nric', 'Witness NRIC / passport'),
      SHARED.next_date('Next court date'),
      SHARED.notes('Matters transpired'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'client_interview',
    label: 'Client interview',
    blurb: 'Interview with a client or person of interest.',
    fields: [
      SHARED.occurred_at(),
      SHARED.counsel('Interviewer'),
      d('venue', 'Venue'),
      d('person_name', 'Person interviewed'),
      d('person_nric_new', 'NRIC (new)'),
      d('person_nric_old', 'NRIC (old)'),
      d('identity', 'Armforce / police identity'),
      d('contact_office', 'Contact — office'),
      d('contact_house', 'Contact — house'),
      d('contact_cellular', 'Contact — cellular'),
      d('address', 'Address', 'textarea', false),
      SHARED.notes('Interview details'),
      SHARED.instructions(),
    ],
  },
  {
    type: 'minutes_of_proceedings',
    label: 'Minutes of proceedings',
    blurb: 'A proceeding entry — committal and/or trial court.',
    fields: [
      SHARED.occurred_at('Date'),
      SHARED.counsel('Counsel attended'),
      SHARED.coram(),
      d('dpp', 'DPP'),
      d('committal_court', 'Committal court'),
      d('trial_court', 'Trial court'),
      d('charges', 'Charge(s)', 'textarea', false),
      SHARED.set_for(),
      SHARED.next_date(),
      SHARED.notes('Matters transpired'),
      SHARED.instructions(),
    ],
  },
]

export const EVENT_TYPE_MAP: Record<CaseEventType, EventTypeConfig> =
  Object.fromEntries(EVENT_TYPES.map((e) => [e.type, e])) as Record<
    CaseEventType,
    EventTypeConfig
  >

// The Zoom section vs the in-person Attendance section. Both are case_events;
// these groupings just drive which templates each sidebar page offers.
export const ZOOM_TYPES: CaseEventType[] = ['zoom_appellate', 'zoom_trial', 'zoom_remand']
export const ZOOM_TEMPLATES = EVENT_TYPES.filter((e) => ZOOM_TYPES.includes(e.type))
export const ATTENDANCE_TEMPLATES = EVENT_TYPES.filter((e) => !ZOOM_TYPES.includes(e.type))

export const SHARED_KEYS = [
  'occurred_at',
  'counsel',
  'coram',
  'set_for',
  'next_date',
  'next_set_for',
  'notes',
] as const
