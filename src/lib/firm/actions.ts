'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'

export type ActionResult = { error: string | null }

// Emergency Read-Only Mode toggle (admin only). Updating firm_settings is not
// blocked by the read-only trigger, so an admin can always lift the freeze.
export async function setReadOnlyMode(enabled: boolean): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin.ok) return { error: admin.error }

  const { error } = await admin.supabase
    .from('firm_settings')
    .update({ read_only: enabled })
    .eq('id', true)
  if (error) return { error: error.message }

  await admin.supabase.from('audit_log').insert({
    actor_id: admin.userId,
    action: enabled ? 'read_only_on' : 'read_only_off',
    resource_type: 'firm_settings',
  })

  revalidatePath('/', 'layout')
  return { error: null }
}

export type FirmSettingsValues = {
  name: string
  bar_council_no: string
  sender_email: string
  primary_hex: string
  retention_years: number
}

export async function updateFirmSettings(
  values: FirmSettingsValues
): Promise<ActionResult> {
  if (!values.name.trim()) return { error: 'Firm name is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('firm_settings')
    .update({
      name: values.name.trim(),
      bar_council_no: values.bar_council_no.trim() || null,
      sender_email: values.sender_email.trim() || null,
      primary_hex: values.primary_hex.trim() || null,
      retention_years: values.retention_years,
    })
    .eq('id', true)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { error: null }
}
