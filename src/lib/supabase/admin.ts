import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Service-role client for contexts with no user session (cron jobs) that need
// to read across all profiles/matters regardless of RLS. Named distinctly
// from server.ts's createClient to avoid mixing this up with the anon-key one.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
