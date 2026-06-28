import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Client = SupabaseClient<Database>

// Used by destructive admin-only server actions. RLS already enforces this at
// the DB; the guard gives a clean error and the user id for audit logging.
export async function requireAdmin(): Promise<
  | { ok: true; supabase: Client; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Only an admin may permanently delete.' }
  }
  return { ok: true, supabase, userId: user.id }
}
