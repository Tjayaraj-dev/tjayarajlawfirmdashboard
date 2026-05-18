import type { Metadata } from 'next'
import { getDemoSession, isDemoModeEnabled } from '@/lib/auth/demo'
import { kpis, matters } from '@/lib/mock/data'
import { GreetingBlock } from '@/components/app/dashboard/greeting-block'
import { KpiCard } from '@/components/app/dashboard/kpi-card'
import { UpcomingHearings } from '@/components/app/dashboard/upcoming-hearings'
import { ActivityFeed } from '@/components/app/dashboard/activity-feed'
import { RecentMatters } from '@/components/app/dashboard/recent-matters'
import { QuickActions } from '@/components/app/dashboard/quick-actions'

export const metadata: Metadata = {
  title: 'Overview · T. Jayaraj & Company',
}

export default async function DashboardPage() {
  const session = isDemoModeEnabled() ? await getDemoSession() : null
  const firstName = session?.firstName ?? 'Counsel'

  const urgentHearings = countUrgentHearings()

  const insight =
    urgentHearings > 0
      ? `${countWord(urgentHearings)} ${urgentHearings === 1 ? 'matter requires' : 'matters require'} your attention today.`
      : 'No urgent attention required today. The week ahead is on track.'

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-10 lg:py-14">
      <GreetingBlock firstName={firstName} insight={insight} />

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        style={{ animation: 'fade-up 700ms ease-out 150ms both' }}
      >
        <KpiCard kpi={kpis.activeMatters} accent="navy" />
        <KpiCard kpi={kpis.hearingsThisWeek} accent="gold" />
        <KpiCard kpi={kpis.pendingDocuments} accent="navy" />
        <KpiCard kpi={kpis.newClientsLast30d} accent="navy" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingHearings />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </section>

      <RecentMatters />

      <QuickActions />
    </div>
  )
}

function countWord(n: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
  return words[n] ?? String(n)
}

function countUrgentHearings(): number {
  const now = Date.now()
  let count = 0
  for (const m of matters) {
    if (!m.nextHearing) continue
    const d = new Date(`${m.nextHearing.date}T${m.nextHearing.time}`)
    const hoursUntil = (d.getTime() - now) / 36e5
    if (hoursUntil > 0 && hoursUntil < 24) count += 1
  }
  return count
}
