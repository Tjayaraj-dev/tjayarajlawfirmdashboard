import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { EVENT_TYPE_MAP, type CaseEventType } from './config'

export type UpcomingRow = {
  matterId: string
  fileRef: string
  title: string
  clientName: string
  date: string
  time: string
  kind: string
  court: string
}

function localDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)

// Merges matters.next_hearing_at with case_events.next_date into one sorted,
// deduped ("events win over the bare matter marker") window of upcoming
// hearings. Shared by the dashboard's 14-day widget and the daily digest's
// 2-day window. case_events has no assigned_to of its own — filtering it by
// recipient goes through the joined matter's assigned_to instead.
export async function getUpcoming(
  supabase: SupabaseClient<Database>,
  { horizonDays, assignedTo }: { horizonDays: number; assignedTo?: string }
): Promise<UpcomingRow[]> {
  const now = new Date()
  const horizon = new Date(now.getTime() + horizonDays * 86400000)
  const todayStart = new Date(now.toDateString())

  let mattersQuery = supabase
    .from('matters')
    .select('id, file_ref, title, next_hearing_at, court, assigned_to, client:clients(name)')
    .not('next_hearing_at', 'is', null)
    .is('deleted_at', null)
  if (assignedTo) mattersQuery = mattersQuery.eq('assigned_to', assignedTo)

  const [{ data: matters }, { data: events }] = await Promise.all([
    mattersQuery,
    supabase
      .from('case_events')
      .select('id, next_date, next_set_for, event_type, matter:matters(id, file_ref, title, court, assigned_to, client:clients(name))')
      .not('next_date', 'is', null)
      .is('deleted_at', null),
  ])

  const rows: UpcomingRow[] = []
  const seen = new Set<string>()

  for (const e of events ?? []) {
    const m = one(e.matter) as
      | { id: string; file_ref: string; title: string; court: string | null; assigned_to: string | null; client: { name: string } | { name: string }[] | null }
      | null
    if (!m) continue
    if (assignedTo && m.assigned_to !== assignedTo) continue
    const d = new Date(`${e.next_date}T00:00:00`)
    if (d < todayStart || d > horizon) continue
    seen.add(`${m.id}|${e.next_date}`)
    rows.push({
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

  for (const m of matters ?? []) {
    if (!m.next_hearing_at) continue
    const { date, time } = localDate(m.next_hearing_at as string)
    const d = new Date(`${date}T00:00:00`)
    if (d < todayStart || d > horizon) continue
    if (seen.has(`${m.id}|${date}`)) continue
    rows.push({
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

  rows.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  return rows
}
