'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = { error: string | null }

// Both editable lookups share the same shape (name + slug). RLS restricts
// writes to admin; this is just the thin server wrapper.
type LookupTable = 'case_types' | 'document_categories'

const PATHS: Record<LookupTable, string> = {
  case_types: '/case-types',
  document_categories: '/document-categories',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createLookup(
  table: LookupTable,
  name: string
): Promise<ActionResult> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from(table)
    .insert({ name: trimmed, slug: slugify(trimmed) })
  if (error) {
    return { error: error.code === '23505' ? 'That name already exists.' : error.message }
  }
  revalidatePath(PATHS[table])
  return { error: null }
}

export async function renameLookup(
  table: LookupTable,
  id: string,
  name: string
): Promise<ActionResult> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from(table)
    .update({ name: trimmed, slug: slugify(trimmed) })
    .eq('id', id)
  if (error) {
    return { error: error.code === '23505' ? 'That name already exists.' : error.message }
  }
  revalidatePath(PATHS[table])
  return { error: null }
}

export async function deleteLookup(
  table: LookupTable,
  id: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    // FK violation => the lookup is referenced by a matter/document.
    return {
      error:
        error.code === '23503'
          ? 'In use by existing records — cannot delete.'
          : error.message,
    }
  }
  revalidatePath(PATHS[table])
  return { error: null }
}
