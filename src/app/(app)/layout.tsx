import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { isDemoModeEnabled } from '@/lib/auth/demo'
import { getCurrentUser } from '@/lib/auth/current-user'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/app/sidebar'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentUser()

  if (!session) {
    redirect('/login')
  }

  // Enforce the second factor + read the emergency read-only flag.
  let readOnly = false
  if (!isDemoModeEnabled()) {
    const supabase = await createClient()
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
      redirect('/mfa')
    }
    const { data: firm } = await supabase
      .from('firm_settings')
      .select('read_only')
      .eq('id', true)
      .single()
    readOnly = !!firm?.read_only
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar session={session} isDemoMode={isDemoModeEnabled()} />
      <main className="min-h-screen flex-1 overflow-x-hidden">
        {readOnly && (
          <div className="sticky top-0 z-20 flex items-center justify-center gap-2 bg-oxblood px-4 py-2 text-center text-xs font-medium text-white">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-white" />
            Emergency read-only mode is active — changes are disabled firm-wide.
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
