import { createClient } from '@/lib/supabase/server'
import { getDemoSession, isDemoModeEnabled } from './demo'
import type { Role } from './roles'

export type AppSession = {
  id: string
  email: string
  name: string
  firstName: string
  role: Role
}

export async function getCurrentUser(): Promise<AppSession | null> {
  if (isDemoModeEnabled()) {
    return getDemoSession()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  const name = profile?.full_name ?? user.email ?? 'User'
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? '',
    name,
    firstName: name.split(' ')[0] ?? name,
    role: (profile?.role ?? 'staff') as Role,
  }
}
