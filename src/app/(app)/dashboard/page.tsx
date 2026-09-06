import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getUpcoming } from '@/lib/case-events/upcoming'
import { MATTER_STATUSES } from '@/lib/matters/schema'
import { GreetingBlock } from '@/components/app/dashboard/greeting-block'
import { KpiCard } from '@/components/app/dashboard/kpi-card'
import { UpcomingHearings } from '@/components/app/dashboard/upcoming-hearings'
import { ActivityFeed, type ActivityEntry } from '@/components/app/dashboard/activity-feed'
import { RecentMatters, type RecentMatterRow } from '@/components/app/dashboard/recent-matters'
import { QuickActions } from '@/components/app/dashboard/quick-actions'

export const metadata: Metadata = {
  title: 'Overview · T. Jayaraj & Company',
}

const STATUS_LABEL = Object.fromEntries(MATTER_STATUSES.map((s) => [s.value, s.label]))

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}
function flatSpark(v: number): number[] {
  return [v, v]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const session = await getCurrentUser()
  const firstName = session?.firstName ?? 'Counsel'

  const [activeCount, clientsCount, docsCount, mattersR, profilesR, auditR, hearings] =
    await Promise.all([
      supabase.from('matters').select('id', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
      supabase.from('clients').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('documents').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase
        .from('matters')
        .select('id, file_ref, title, status, opened_at, next_hearing_at, court, assigned_to, client:clients(name), case_type:case_types(name)')
        .is('deleted_at', null)
        .order('opened_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name'),
      supabase.from('audit_log').select('id, action, resource_type, at, actor:profiles(full_name)').order('at', { ascending: false }).limit(8),
      getUpcoming(supabase, { horizonDays: 14 }),
    ])

  const matters = mattersR.data ?? []
  const profileName = new Map((profilesR.data ?? []).map((p) => [p.id, p.full_name]))

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)

  const recent: RecentMatterRow[] = matters.slice(0, 5).map((m) => {
    const assignedName = (m.assigned_to && profileName.get(m.assigned_to)) || ''
    return {
      id: m.id,
      fileRef: m.file_ref,
      title: m.title,
      clientName: one(m.client)?.name ?? '—',
      statusLabel: STATUS_LABEL[m.status] ?? m.status,
      practiceArea: one(m.case_type)?.name ?? '—',
      assignedInitials: assignedName ? initials(assignedName) : '··',
      assignedName: assignedName || 'Assigned',
    }
  })

  const activity: ActivityEntry[] = (auditR.data ?? []).map((a) => {
    const actor = Array.isArray(a.actor) ? a.actor[0] : a.actor
    return {
      id: a.id,
      actor: actor?.full_name ?? 'Someone',
      action: a.action,
      resourceType: a.resource_type,
      at: a.at,
    }
  })

  const insight =
    hearings.length > 0
      ? `${hearings.length} ${hearings.length === 1 ? 'hearing' : 'hearings'} in the next fortnight.`
      : 'No hearings scheduled in the fortnight ahead.'

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-10 lg:py-14">
      <GreetingBlock firstName={firstName} insight={insight} />

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        style={{ animation: 'fade-up 700ms ease-out 150ms both' }}
      >
        <KpiCard kpi={{ label: 'Active matters', value: activeCount.count ?? 0, trend: 0, trendLabel: 'Open files', sparkline: flatSpark(activeCount.count ?? 0) }} accent="navy" />
        <KpiCard kpi={{ label: 'Hearings · 14 days', value: hearings.length, trend: 0, trendLabel: 'Upcoming', sparkline: flatSpark(hearings.length) }} accent="gold" />
        <KpiCard kpi={{ label: 'Clients', value: clientsCount.count ?? 0, trend: 0, trendLabel: 'On the books', sparkline: flatSpark(clientsCount.count ?? 0) }} accent="navy" />
        <KpiCard kpi={{ label: 'Documents', value: docsCount.count ?? 0, trend: 0, trendLabel: 'In the vault', sparkline: flatSpark(docsCount.count ?? 0) }} accent="navy" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingHearings rows={hearings} />
        </div>
        <div>
          <ActivityFeed entries={activity} />
        </div>
      </section>

      <RecentMatters recent={recent} />

      <QuickActions />
    </div>
  )
}
