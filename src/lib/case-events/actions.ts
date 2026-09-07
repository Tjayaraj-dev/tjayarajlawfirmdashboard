'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { EVENT_TYPE_MAP, type CaseEventType } from './config'

export type ActionResult = { error: string | null }

// Logging one of these with a "next date" also bumps the matter's headline
// next hearing (so the matters list + calendar stay current).
const COURTROOM: CaseEventType[] = [
  'court_attendance',
  'civil_court_attendance',
  'advisory_board',
  'remand_proceeding',
  'minutes_of_proceedings',
  'zoom_appellate',
  'zoom_trial',
  'zoom_remand',
]

export async function createCaseEvent(
  matterId: string,
  type: CaseEventType,
  values: Record<string, string>
): Promise<ActionResult> {
  const cfg = EVENT_TYPE_MAP[type]
  if (!cfg) return { error: 'Unknown event type' }
  if (!values.occurred_at) return { error: 'Date & time is required' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const details: Record<string, string> = {}
  for (const f of cfg.fields) {
    if (f.detail) {
      const v = values[f.key]?.trim()
      if (v) details[f.key] = v
    }
  }

  const nextDate = values.next_date || null

  const { error } = await supabase.from('case_events').insert({
    matter_id: matterId,
    event_type: type,
    occurred_at: new Date(values.occurred_at).toISOString(),
    counsel: values.counsel?.trim() || null,
    coram: values.coram?.trim() || null,
    set_for: values.set_for?.trim() || null,
    next_date: nextDate,
    next_set_for: values.next_set_for?.trim() || null,
    notes: values.notes?.trim() || null,
    details,
    created_by: user.id,
  })
  if (error) return { error: error.message }

  // Keep the matter's headline "next hearing" current for courtroom events.
  if (nextDate && COURTROOM.includes(type)) {
    await supabase
      .from('matters')
      .update({ next_hearing_at: new Date(`${nextDate}T09:00:00`).toISOString() })
      .eq('id', matterId)
  }

  revalidatePath(`/matters/${matterId}`)
  revalidatePath('/matters')
  return { error: null }
}

// Edits an existing event's fields in place. The event's type is fixed (it
// determines which fields exist) — only field values change, never the type.
export async function updateCaseEvent(
  id: string,
  matterId: string,
  type: CaseEventType,
  values: Record<string, string>
): Promise<ActionResult> {
  const cfg = EVENT_TYPE_MAP[type]
  if (!cfg) return { error: 'Unknown event type' }
  if (!values.occurred_at) return { error: 'Date & time is required' }

  const supabase = await createClient()

  const details: Record<string, string> = {}
  for (const f of cfg.fields) {
    if (f.detail) {
      const v = values[f.key]?.trim()
      if (v) details[f.key] = v
    }
  }

  const nextDate = values.next_date || null

  const { error } = await supabase
    .from('case_events')
    .update({
      occurred_at: new Date(values.occurred_at).toISOString(),
      counsel: values.counsel?.trim() || null,
      coram: values.coram?.trim() || null,
      set_for: values.set_for?.trim() || null,
      next_date: nextDate,
      next_set_for: values.next_set_for?.trim() || null,
      notes: values.notes?.trim() || null,
      details,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  if (nextDate && COURTROOM.includes(type)) {
    await supabase
      .from('matters')
      .update({ next_hearing_at: new Date(`${nextDate}T09:00:00`).toISOString() })
      .eq('id', matterId)
  }

  revalidatePath(`/matters/${matterId}`)
  revalidatePath('/matters')
  revalidatePath('/calendar')
  return { error: null }
}

// Drag-to-reschedule on the calendar. Re-fetches the event's own type/matter
// server-side rather than trusting the client, then mirrors createCaseEvent's
// courtroom cascade so the matter's headline next hearing stays in sync.
export async function rescheduleCaseEvent(
  id: string,
  nextDate: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: row, error: fetchError } = await supabase
    .from('case_events')
    .select('matter_id, event_type')
    .eq('id', id)
    .single()
  if (fetchError || !row) return { error: fetchError?.message ?? 'Event not found' }

  const { error } = await supabase
    .from('case_events')
    .update({ next_date: nextDate })
    .eq('id', id)
  if (error) return { error: error.message }

  if (COURTROOM.includes(row.event_type as CaseEventType)) {
    await supabase
      .from('matters')
      .update({ next_hearing_at: new Date(`${nextDate}T09:00:00`).toISOString() })
      .eq('id', row.matter_id)
  }

  revalidatePath(`/matters/${row.matter_id}`)
  revalidatePath('/matters')
  revalidatePath('/calendar')
  return { error: null }
}

export async function softDeleteCaseEvent(
  id: string,
  matterId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('case_events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/matters/${matterId}`)
  revalidatePath('/calendar')
  return { error: null }
}

// Permanent delete (admin only), audited.
export async function hardDeleteCaseEvent(
  id: string,
  matterId: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin.ok) return { error: admin.error }
  const { supabase, userId } = admin

  const { error } = await supabase.from('case_events').delete().eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    actor_id: userId,
    action: 'hard_delete',
    resource_type: 'case_events',
    resource_id: id,
    payload: { matter_id: matterId },
  })

  revalidatePath(`/matters/${matterId}`)
  return { error: null }
}
