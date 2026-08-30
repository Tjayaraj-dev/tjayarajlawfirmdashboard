'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'

export type ActionResult = { error: string | null }
export type SignedUrlResult = { url?: string; error?: string }

const BUCKET = 'documents'

// Signed URLs only — the bucket is private. Every download is logged to the
// audit trail (the Bar Council "who saw this file" answer).
export async function getDocumentUrl(id: string): Promise<SignedUrlResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path, matter_id')
    .eq('id', id)
    .single()
  if (!doc) return { error: 'Document not found' }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60)
  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    actor_id: user.id,
    action: 'download',
    resource_type: 'documents',
    resource_id: id,
    payload: { matter_id: doc.matter_id },
  })

  return { url: data.signedUrl }
}

export async function softDeleteDocument(
  id: string,
  matterId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/matters/${matterId}`)
  return { error: null }
}

// Permanent delete (admin only): removes the storage object and the row, audited.
export async function hardDeleteDocument(
  id: string,
  matterId: string
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin.ok) return { error: admin.error }
  const { supabase, userId } = admin

  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path, filename')
    .eq('id', id)
    .single()
  if (doc?.storage_path) {
    await supabase.storage.from(BUCKET).remove([doc.storage_path])
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    actor_id: userId,
    action: 'hard_delete',
    resource_type: 'documents',
    resource_id: id,
    payload: { filename: doc?.filename },
  })

  revalidatePath(`/matters/${matterId}`)
  revalidatePath('/documents')
  return { error: null }
}
