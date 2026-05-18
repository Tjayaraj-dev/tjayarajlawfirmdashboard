import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getDemoSession, isDemoModeEnabled } from '@/lib/auth/demo'
import { Sidebar } from '@/components/app/sidebar'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const demoActive = isDemoModeEnabled()
  const session = demoActive ? await getDemoSession() : null

  if (demoActive && !session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar session={session} isDemoMode={demoActive} />
      <main className="min-h-screen flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
