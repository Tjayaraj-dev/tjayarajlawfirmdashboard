// Fields each case type's file cover captures, keyed by case_type slug. These
// render in the matter form and store in matters.custom_fields (jsonb). Input
// 'court' renders the Courts dropdown.

export type MatterFieldInput = 'text' | 'textarea' | 'court'
export type MatterFieldDef = {
  key: string
  label: string
  input: MatterFieldInput
  half?: boolean
}

export const APPOINTMENT_TYPES = [
  { value: 'client_appointed', label: 'Client-appointed (Lantikan Anak Guam)' },
  { value: 'court_appointed', label: 'Court-appointed (Lantikan Mahkamah)' },
] as const

const t = (key: string, label: string): MatterFieldDef => ({ key, label, input: 'text', half: true })
const court = (key: string, label: string): MatterFieldDef => ({ key, label, input: 'court', half: true })

function committalFields(): MatterFieldDef[] {
  return [
    court('committal_court', 'Committal court'),
    t('committal_accused', 'Accused (committal)'),
    t('original_charge', 'Original charge (section)'),
    t('committal_case_no', 'Case no. (committal)'),
    t('committal_coram', 'Coram (committal)'),
    t('committal_dpp', 'DPP (committal)'),
    t('trial_accused', 'Accused (trial)'),
    t('amended_charge', 'Amended charge (section)'),
    t('trial_case_no', 'Case no. (trial)'),
    t('trial_coram', 'Coram (trial)'),
    t('trial_dpp', 'DPP (trial)'),
  ]
}

export const CASE_TYPE_FIELDS: Record<string, MatterFieldDef[]> = {
  'criminal-penal-code': [
    t('accused', 'Accused'),
    t('charge_section', 'Charge (section)'),
    t('case_no', 'Case no.'),
    t('coram', 'Coram'),
    t('dpp', 'DPP (name & email)'),
  ],
  'civil-ncvc-ncva': [
    t('case_no', 'Case no.'),
    t('plaintiff', 'Plaintiff / applicant'),
    t('plaintiff_solicitor', 'Plaintiff solicitor (name / contact / email)'),
    t('defendant', 'Defendant / respondent'),
    t('defendant_solicitor', 'Defendant solicitor (name / contact / email)'),
  ],
  'committal-high-court': committalFields(),
  'committal-lower-court': committalFields(),
}

export function caseTypeFields(slug?: string | null): MatterFieldDef[] {
  return (slug && CASE_TYPE_FIELDS[slug]) || []
}
