import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { EVENT_TYPE_MAP, type CaseEventType } from '@/lib/case-events/config'
import { MATTER_STATUSES } from '@/lib/matters/schema'
import { GreetingBlock } from '@/components/app/dashboard/greeting-block'
import { KpiCard } from '@/components/app/dashboard/kpi-card'
import { UpcomingHearings, type HearingRow } from '@/components/app/dashboard/upcoming-hearings'
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
function localDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const session = await getCurrentUser()
  const firstName = session?.firstName ?? 'Counsel'

  const [activeCount, clientsCount, docsCount, mattersR, eventsR, profilesR, auditR] =
    await Promise.all([
      supabase.from('matters').select('id', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
      supabase.from('clients').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('documents').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabase
        .from('matters')
        .select('id, file_ref, title, status, opened_at, next_hearing_at, court, assigned_to, client:clients(name), case_type:case_types(name)')
        .is('deleted_at', null)
        .order('opened_at', { ascending: false }),
      supabase
        .from('case_events')
        .select('id, next_date, next_set_for, event_type, matter:matters(id, file_ref, title, court, client:clients(name))')
        .not('next_date', 'is', null)
        .is('deleted_at', null),
      supabase.from('profiles').select('id, full_name'),
      supabase.from('audit_log').select('id, action, resource_type, at, actor:profiles(full_name)').order('at', { ascending: false }).limit(8),
    ])

  const matters = mattersR.data ?? []
  const events = eventsR.data ?? []
  const profileName = new Map((profilesR.data ?? []).map((p) => [p.id, p.full_name]))

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v)

  // Upcoming hearings (next 14 days) from matters' next_hearing_at + event next dates.
  const now = new Date()
  const horizon = new Date(now.getTime() + 14 * 86400000)
  const hearings: HearingRow[] = []
  const seen = new Set<string>()

  for (const e of events) {
    const m = (Array.isArray(e.matter) ? e.matter[0] : e.matter) as
      | { id: string; file_ref: string; title: string; court: string | null; client: { name: string } | { name: string }[] | null }
      | null
    if (!m) continue
    const d = new Date(`${e.next_date}T00:00:00`)
    if (d < new Date(now.toDateString()) || d > horizon) continue
    seen.add(`${m.id}|${e.next_date}`)
    hearings.push({
      matterId: m.id,
      fileRef: m.file_ref,
      title: m.title,
      clientName: one(m.client)?.name ?? '',
      date: e.next_date as string,
      time: '',
      kind: e.next_set_for || EVENT_TYPE_MAP[e.event_type as CaseEventType].label,
      court: m.court ?? '',
    })
  }
  for (const m of matters) {
    if (!m.next_hearing_at) continue
    const { date, time } = localDate(m.next_hearing_at)
    const d = new Date(`${date}T00:00:00`)
    if (d < new Date(now.toDateString()) || d > horizon) continue
    if (seen.has(`${m.id}|${date}`)) continue
    hearings.push({
      matterId: m.id,
      fileRef: m.file_ref,
      title: m.title,
      clientName: one(m.client)?.name ?? '',
      date,
      time,
      kind: 'Hearing',
      court: m.court ?? '',
    })
  }
  hearings.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

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
