import { createClient } from '@/lib/supabase/server'
import { CalendarBoard, type CalendarItem } from '@/components/app/calendar/calendar-board'
import { EVENT_TYPE_MAP } from '@/lib/case-events/config'

function localDate(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export default async function CalendarPage() {
  const supabase = await createClient()

  const [{ data: matters }, { data: events }, { data: allMatters }] = await Promise.all([
    supabase
      .from('matters')
      .select('id, file_ref, title, next_hearing_at')
      .not('next_hearing_at', 'is', null)
      .is('deleted_at', null),
    supabase
      .from('case_events')
      .select('id, matter_id, next_date, next_set_for, event_type, matter:matters(file_ref, title)')
      .not('next_date', 'is', null)
      .is('deleted_at', null),
    supabase
      .from('matters')
      .select('id, file_ref, title')
      .is('deleted_at', null)
      .order('file_ref'),
  ])

  const items: CalendarItem[] = []
  const seen = new Set<string>()

  // Events carry the richest context (set-for label), so they win on dedupe.
  for (const e of events ?? []) {
    const m = Array.isArray(e.matter) ? e.matter[0] : e.matter
    const date = e.next_date as string
    seen.add(`${e.matter_id}|${date}`)
    items.push({
      id: `ev-${e.id}`,
      date,
      time: null,
      label: e.next_set_for || EVENT_TYPE_MAP[e.event_type].label,
      fileRef: m?.file_ref ?? '',
      matterId: e.matter_id,
      kind: EVENT_TYPE_MAP[e.event_type].label,
    })
  }

  for (const m of matters ?? []) {
    const { date, time } = localDate(m.next_hearing_at as string)
    if (seen.has(`${m.id}|${date}`)) continue
    items.push({
      id: `mt-${m.id}`,
      date,
      time,
      label: m.title,
      fileRef: m.file_ref,
      matterId: m.id,
      kind: 'Hearing',
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
          Diary
        </p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Calendar
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Every hearing, mention, prison visit and next date across the firm —
          drawn straight from the matters and their logged events.
        </p>
      </header>

      <CalendarBoard items={items} matters={allMatters ?? []} />
    </div>
  )
}
