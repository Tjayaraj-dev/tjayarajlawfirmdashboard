'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/auth/roles'

export type ActionResult = { error: string | null }

// Admin changes another user's role. The profiles_role_guard trigger allows
// this only because the caller is_admin(); a non-admin is rejected at the DB.
export async function setUserRole(
  userId: string,
  role: Role
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/users')
  return { error: null }
}
