// The five physical forms the firm hands counsel. Each maps to a case_event.
// Fields flagged `detail` land in the details jsonb; the rest are real columns
// on case_events (the shared spine: occurred_at, counsel, coram, set_for,
// next_date, next_set_for, notes).

export type CaseEventType =
  | 'court_attendance'
  | 'zoom_attendance'
  | 'prison_attendance'
  | 'client_interview'
  | 'minutes_of_proceedings'

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
  coram: (): FieldDef => ({ key: 'coram', label: 'Coram', input: 'text', half: true }),
  set_for: (label = 'Set for'): FieldDef => ({ key: 'set_for', label, input: 'text', half: true }),
  next_date: (label = 'Next date'): FieldDef => ({ key: 'next_date', label, input: 'date', half: true }),
  next_set_for: (): FieldDef => ({ key: 'next_set_for', label: 'Next — set for', input: 'text', half: true }),
  notes: (label = 'Notes / remarks'): FieldDef => ({ key: 'notes', label, input: 'textarea' }),
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
    label: 'Court attendance',
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
      SHARED.notes('Matters transpired / remarks'),
    ],
  },
  {
    type: 'zoom_attendance',
    label: 'Zoom session',
    blurb: 'Remote attendance via Zoom.',
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
      SHARED.notes('Matters transpired / remarks'),
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
      SHARED.notes(),
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
      SHARED.notes(),
    ],
  },
]

export const EVENT_TYPE_MAP: Record<CaseEventType, EventTypeConfig> =
  Object.fromEntries(EVENT_TYPES.map((e) => [e.type, e])) as Record<
    CaseEventType,
    EventTypeConfig
  >

export const SHARED_KEYS = [
  'occurred_at',
  'counsel',
  'coram',
  'set_for',
  'next_date',
  'next_set_for',
  'notes',
] as const
