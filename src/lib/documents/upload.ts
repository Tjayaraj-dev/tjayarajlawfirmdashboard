import { createClient } from '@/lib/supabase/client'

const BUCKET = 'documents'
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024
export const MAX_DOCUMENT_SIZE_LABEL = '50 MB'

type UploadOptions = {
  matterId: string
  file: File
  categoryId?: string
  eventId?: string
}

export async function uploadDocument({
  matterId,
  file,
  categoryId,
  eventId,
}: UploadOptions): Promise<{ error: string | null }> {
  if (!file.size) return { error: 'Choose a file to upload' }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { error: `File must be ${MAX_DOCUMENT_SIZE_LABEL} or smaller` }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Sign in and try again.' }

  const { data: prior, error: versionError } = await supabase
    .from('documents')
    .select('version')
    .eq('matter_id', matterId)
    .eq('filename', file.name)
    .order('version', { ascending: false })
    .limit(1)
  if (versionError) return { error: versionError.message }

  const version = prior?.[0] ? prior[0].version + 1 : 1
  const path = `${matterId}/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (uploadError) return { error: uploadError.message }

  const { error } = await supabase.from('documents').insert({
    matter_id: matterId,
    category_id: categoryId || null,
    case_event_id: eventId || null,
    filename: file.name,
    storage_path: path,
    version,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: user.id,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    return { error: error.message }
  }

  return { error: null }
}
