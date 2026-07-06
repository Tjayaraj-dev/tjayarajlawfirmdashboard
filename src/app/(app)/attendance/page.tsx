import { createClient } from '@/lib/supabase/server'
import { AttendanceRegister, type AttendanceRow } from '@/components/app/attendance/attendance-register'
import { ATTENDANCE_TEMPLATES, ZOOM_TYPES } from '@/lib/case-events/config'

export default async function AttendancePage() {
  const supabase = await createClient()

  const [{ data: events }, { data: matters }, { data: atts }] = await Promise.all([
    supabase
      .from('case_events')
      .select('id, event_type, occurred_at, counsel, next_date, matter:matters(id, file_ref, title, client:clients(name))')
      .is('deleted_at', null)
      .not('event_type', 'in', `(${ZOOM_TYPES.join(',')})`)
      .order('occurred_at', { ascending: false }),
    supabase.from('matters').select('id, file_ref, title, client_id, client:clients(name)').is('deleted_at', null).order('file_ref'),
    supabase.from('documents').select('id, filename, file_size, case_event_id').not('case_event_id', 'is', null).is('deleted_at', null),
  ])

  const matterOptions = (matters ?? []).map((m) => {
    const c = Array.isArray(m.client) ? m.client[0] : m.client
    return { id: m.id, file_ref: m.file_ref, title: m.title, client_id: m.client_id ?? '', client_name: c?.name ?? '' }
  })

  const attachmentsByEvent: Record<string, { id: string; filename: string; file_size: number | null }[]> = {}
  for (const a of atts ?? []) {
    if (a.case_event_id) (attachmentsByEvent[a.case_event_id] ??= []).push({ id: a.id, filename: a.filename, file_size: a.file_size })
  }

  const rows = (events ?? []).map((e) => {
    const m = Array.isArray(e.matter) ? e.matter[0] : e.matter
    const client = m ? (Array.isArray(m.client) ? m.client[0] : m.client) : null
    return { ...e, matter: m ? { ...m, client } : null }
  }) as AttendanceRow[]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Register</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Attendance Sheets
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          In-person attendance sheets across the firm — court, civil, prison,
          remand, advisory board and more. Each follows the firm’s standard
          template and links to its case file. Zoom sessions have their own page.
        </p>
      </header>

      <AttendanceRegister rows={rows} matters={matterOptions} templates={ATTENDANCE_TEMPLATES} attachmentsByEvent={attachmentsByEvent} />
    </div>
  )
}
