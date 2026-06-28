'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { clientFormSchema, type ClientFormValues } from './schema'

export type ActionResult = { error: string | null }

// Mutations run through the user-scoped client so RLS applies and the audit
// trigger captures auth.uid() as the actor. Soft-delete/restore are plain
// updates to deleted_at — the trigger classifies them automatically.

export async function createClientRecord(
  values: ClientFormValues
): Promise<ActionResult> {
  const parsed = clientFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const d = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: inserted, error } = await supabase
    .from('clients')
    .insert({
      name: d.name,
      type: d.type,
      ic_or_company_no: d.ic_or_company_no || null,
      reference_no: d.reference_no || null,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
      created_by: user.id,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  // Optional: open the client's first matter from the intake case section.
  if (d.case_file_ref) {
    const title =
      d.case_details?.trim().split('\n')[0].slice(0, 80) || `${d.name} — matter`
    const { error: mErr } = await supabase.from('matters').insert({
      client_id: inserted.id,
      file_ref: d.case_file_ref,
      title,
      case_type_id: d.case_type_id || null,
      description: d.case_details || null,
      assigned_to: user.id,
      created_by: user.id,
    })
    if (mErr) {
      return {
        error:
          mErr.code === '23505'
            ? 'Client saved, but that case file reference is already in use.'
            : `Client saved, but opening the case failed: ${mErr.message}`,
      }
    }
    revalidatePath('/matters')
  }

  revalidatePath('/clients')
  return { error: null }
}

export async function updateClientRecord(
  id: string,
  values: ClientFormValues
): Promise<ActionResult> {
  const parsed = clientFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const d = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({
      name: d.name,
      type: d.type,
      ic_or_company_no: d.ic_or_company_no || null,
      reference_no: d.reference_no || null,
      phone: d.phone || null,
      email: d.email || null,
      address: d.address || null,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}

export async function softDeleteClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}

export async function restoreClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}

// Permanent delete (admin only). Cascades to the client's matters, their case
// events and documents. Storage objects are purged first; the deletion is
// audited before the row is destroyed.
export async function hardDeleteClient(id: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin.ok) return { error: admin.error }
  const { supabase, userId } = admin

  const { data: matters } = await supabase.from('matters').select('id').eq('client_id', id)
  const matterIds = (matters ?? []).map((m) => m.id)
  if (matterIds.length) {
    const { data: docs } = await supabase
      .from('documents')
      .select('storage_path')
      .in('matter_id', matterIds)
    const paths = (docs ?? []).map((d) => d.storage_path)
    if (paths.length) await supabase.storage.from('documents').remove(paths)
  }

  const { data: client } = await supabase.from('clients').select('name').eq('id', id).single()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    actor_id: userId,
    action: 'hard_delete',
    resource_type: 'clients',
    resource_id: id,
    payload: { name: client?.name, cascaded_matters: matterIds.length },
  })

  revalidatePath('/clients')
  return { error: null }
}
