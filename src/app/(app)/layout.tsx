import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getDemoSession, isDemoModeEnabled } from '@/lib/auth/demo'
import { SignOutButton } from '@/components/app/sign-out-button'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = isDemoModeEnabled() ? await getDemoSession() : null

  if (isDemoModeEnabled() && !session) {
    redirect('/login')
  }

  const displayName = session?.name ?? 'Signed in'
  const displayRole = session?.role ?? null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-brand-gold/40 bg-brand-gold/10 font-display text-xs text-brand-gold">
              TJ
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-medium tracking-[0.15em] text-brand-navy">
                T. JAYARAJ &amp; COMPANY
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Command Centre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right leading-tight">
              <p className="font-display text-sm text-brand-navy">
                {displayName}
              </p>
              {displayRole && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold">
                  {displayRole}
                </p>
              )}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
