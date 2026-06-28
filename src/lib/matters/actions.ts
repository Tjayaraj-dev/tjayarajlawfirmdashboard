'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { matterFormSchema, type MatterFormValues } from './schema'

export type ActionResult = { error: string | null }

function toRow(values: MatterFormValues) {
  return {
    client_id: values.client_id,
    file_ref: values.file_ref,
    title: values.title,
    status: values.status,
    opened_at: values.opened_at,
    court: values.court || null,
    case_no_committal: values.case_no_committal || null,
    case_no_trial: values.case_no_trial || null,
    accused: values.accused || null,
    charges: values.charges || null,
    prosecutor_dpp: values.prosecutor_dpp || null,
    opposing_counsel: values.opposing_counsel || null,
    description: values.description || null,
    next_hearing_at: values.next_hearing_at
      ? new Date(values.next_hearing_at).toISOString()
      : null,
  }
}

function friendly(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'A matter with that file reference already exists.'
  }
  return error.message
}

export async function createMatterRecord(
  values: MatterFormValues
): Promise<ActionResult> {
  const parsed = matterFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('matters').insert({
    ...toRow(parsed.data),
    assigned_to: user.id,
    created_by: user.id,
  })
  if (error) return { error: friendly(error) }

  revalidatePath('/matters')
  return { error: null }
}

export async function updateMatterRecord(
  id: string,
  values: MatterFormValues
): Promise<ActionResult> {
  const parsed = matterFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('matters')
    .update(toRow(parsed.data))
    .eq('id', id)
  if (error) return { error: friendly(error) }

  revalidatePath('/matters')
  return { error: null }
}

export async function softDeleteMatter(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('matters')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/matters')
  return { error: null }
}

export async function restoreMatter(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('matters')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/matters')
  return { error: null }
}

// Permanent delete (admin only). Cascades to this matter's case events and
// documents. Storage objects purged first; audited before deletion.
export async function hardDeleteMatter(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin.ok) return { error: admin.error }
  const { supabase, userId } = admin

  const { data: docs } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('matter_id', id)
  const paths = (docs ?? []).map((d) => d.storage_path)
  if (paths.length) await supabase.storage.from('documents').remove(paths)

  const { data: matter } = await supabase.from('matters').select('file_ref').eq('id', id).single()
  const { error } = await supabase.from('matters').delete().eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    actor_id: userId,
    action: 'hard_delete',
    resource_type: 'matters',
    resource_id: id,
    payload: { file_ref: matter?.file_ref },
  })

  revalidatePath('/matters')
  return { error: null }
}
