import type { Metadata } from 'next'
import { getDemoSession, isDemoModeEnabled } from '@/lib/auth/demo'

export const metadata: Metadata = {
  title: 'Dashboard · T. Jayaraj & Company',
}

export default async function DashboardPage() {
  const session = isDemoModeEnabled() ? await getDemoSession() : null
  const greeting = getTimeGreeting()
  const firstName = session?.name?.split(' ')[0] ?? 'Counsel'

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
          {greeting}
        </p>
        <h1 className="font-display text-4xl font-light leading-tight tracking-tight text-brand-navy lg:text-5xl">
          Welcome, <span className="italic">{firstName}.</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Your command centre is ready. Modules will populate here as we
          build them — active matters, hearings, recent documents, and the
          firm ledger.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Matters', hint: 'Module coming · Phase B' },
          { label: 'Hearings This Week', hint: 'Module coming · Phase B' },
          { label: 'Pending Documents', hint: 'Module coming · Phase B' },
          { label: 'Recent Activity', hint: 'Module coming · Phase B' },
        ].map((widget) => (
          <div
            key={widget.label}
            className="rounded-lg border border-brand-navy/10 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,50,0.04)]"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {widget.label}
            </p>
            <p className="mt-3 font-display text-3xl font-light text-brand-navy/30">
              —
            </p>
            <p className="mt-1 text-[10px] italic text-brand-navy/40">
              {widget.hint}
            </p>
          </div>
        ))}
      </div>

      {session && (
        <div className="mt-12 rounded-lg border border-brand-gold/30 bg-brand-gold/[0.04] p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold">
            Demo Session
          </p>
          <p className="mt-2 text-sm text-brand-navy">
            You&rsquo;re signed in as{' '}
            <span className="font-medium">{session.name}</span>{' '}
            <span className="text-muted-foreground">
              ({session.email} · {session.role})
            </span>
            . Demo mode is active because Supabase keys aren&rsquo;t set in
            <code className="ml-1 rounded bg-brand-navy/5 px-1.5 py-0.5 font-mono text-[11px]">
              .env.local
            </code>
            . Real auth kicks in automatically when keys land.
          </p>
        </div>
      )}
    </div>
  )
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
