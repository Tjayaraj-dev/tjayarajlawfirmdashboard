'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'

export type ActionResult = { error: string | null }
export type SignedUrlResult = { url?: string; error?: string }

const BUCKET = 'documents'

export async function uploadDocument(
  matterId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get('file')
  const categoryId = (formData.get('category_id') as string) || null
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a file to upload' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Versioning: re-upload of the same filename in this matter = new row,
  // incremented version, old row preserved (never overwritten).
  const { data: prior } = await supabase
    .from('documents')
    .select('version')
    .eq('matter_id', matterId)
    .eq('filename', file.name)
    .order('version', { ascending: false })
    .limit(1)
  const version = prior?.[0] ? prior[0].version + 1 : 1

  const path = `${matterId}/${crypto.randomUUID()}-${file.name}`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (upErr) return { error: upErr.message }

  const { error } = await supabase.from('documents').insert({
    matter_id: matterId,
    category_id: categoryId,
    filename: file.name,
    storage_path: path,
    version,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: user.id,
  })
  if (error) {
    // Roll back the orphaned object if the row insert failed.
    await supabase.storage.from(BUCKET).remove([path])
    return { error: error.message }
  }

  revalidatePath(`/matters/${matterId}`)
  return { error: null }
}

// Attach a scanned file directly to a case event (the signed sheet on its
// digital record). Same storage + versioning as uploadDocument, but linked to
// the event as well as the matter.
export async function uploadEventDocument(
  matterId: string,
  eventId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a file to attach' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const path = `${matterId}/${crypto.randomUUID()}-${file.name}`
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (upErr) return { error: upErr.message }

  const { error } = await supabase.from('documents').insert({
    matter_id: matterId,
    case_event_id: eventId,
    filename: file.name,
    storage_path: path,
    version: 1,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: user.id,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    return { error: error.message }
  }

  revalidatePath(`/matters/${matterId}`)
  revalidatePath('/attendance')
  revalidatePath('/zoom')
  return { error: null }
}

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
