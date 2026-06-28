import { z } from 'zod'

export const MATTER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'pending_filing', label: 'Pending filing' },
  { value: 'closed', label: 'Closed' },
] as const

export const matterFormSchema = z.object({
  client_id: z.string().uuid('Select a client'),
  file_ref: z.string().trim().min(1, 'File reference is required').max(100),
  title: z.string().trim().min(1, 'Title is required').max(300),
  status: z.enum(['active', 'on_hold', 'pending_filing', 'closed']),
  opened_at: z.string().min(1, 'Opened date is required'),
  // Criminal-defence fields surfaced by the firm's attendance/proceedings forms.
  court: z.string().trim().max(200).optional(),
  case_no_committal: z.string().trim().max(100).optional(),
  case_no_trial: z.string().trim().max(100).optional(),
  accused: z.string().trim().max(300).optional(),
  charges: z.string().trim().max(2000).optional(),
  prosecutor_dpp: z.string().trim().max(200).optional(),
  opposing_counsel: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  next_hearing_at: z.string().optional(),
})

export type MatterFormValues = z.infer<typeof matterFormSchema>

export function emptyMatterForm(): MatterFormValues {
  return {
    client_id: '',
    file_ref: '',
    title: '',
    status: 'active',
    opened_at: new Date().toISOString().slice(0, 10),
    court: '',
    case_no_committal: '',
    case_no_trial: '',
    accused: '',
    charges: '',
    prosecutor_dpp: '',
    opposing_counsel: '',
    description: '',
    next_hearing_at: '',
  }
}
