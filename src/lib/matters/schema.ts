import { z } from 'zod'

export const MATTER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'pending_filing', label: 'Pending filing' },
  { value: 'closed', label: 'Closed' },
] as const

// Core matter fields. Case-type-specific fields (accused, plaintiff, committal
// sections, etc.) are driven by case-type-config and stored in custom_fields.
export const matterFormSchema = z.object({
  client_id: z.string().uuid('Select a client'),
  file_ref: z.string().trim().min(1, 'File reference is required').max(100),
  title: z.string().trim().min(1, 'Title is required').max(300),
  case_type_id: z.string().uuid().optional().or(z.literal('')),
  appointment_type: z
    .enum(['client_appointed', 'court_appointed'])
    .optional()
    .or(z.literal('')),
  court: z.string().trim().max(200).optional(),
  status: z.enum(['active', 'on_hold', 'pending_filing', 'closed']),
  opened_at: z.string().min(1, 'Opened date is required'),
  next_hearing_at: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
})

export type MatterFormValues = z.infer<typeof matterFormSchema>

export const scheduleNextHearingSchema = z.object({
  matterId: z.string().uuid('Select a matter'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional().or(z.literal('')),
})

export type ScheduleNextHearingValues = z.infer<typeof scheduleNextHearingSchema>

export function emptyMatterForm(): MatterFormValues {
  return {
    client_id: '',
    file_ref: '',
    title: '',
    case_type_id: '',
    appointment_type: '',
    court: '',
    status: 'active',
    opened_at: new Date().toISOString().slice(0, 10),
    next_hearing_at: '',
    description: '',
  }
}
