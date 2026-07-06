import { createClient } from '@/lib/supabase/server'
import { AttendanceRegister, type AttendanceRow } from '@/components/app/attendance/attendance-register'
import { ZoomDocuments, type AppellateDoc } from '@/components/app/zoom/zoom-documents'
import { ZOOM_TEMPLATES, ZOOM_TYPES } from '@/lib/case-events/config'
import { APPELLATE_CATEGORY_SLUGS } from '@/lib/documents/appellate'

export default async function ZoomPage() {
  const supabase = await createClient()

  const { data: ahCats } = await supabase
    .from('document_categories')
    .select('id, name, slug')
    .in('slug', APPELLATE_CATEGORY_SLUGS)
    .order('name')
  const ahCatIds = (ahCats ?? []).map((c) => c.id)

  const [{ data: events }, { data: matters }, { data: atts }, { data: ahDocs }] = await Promise.all([
    supabase
      .from('case_events')
      .select('id, event_type, occurred_at, counsel, next_date, matter:matters(id, file_ref, title, client:clients(name))')
      .is('deleted_at', null)
      .in('event_type', ZOOM_TYPES)
      .order('occurred_at', { ascending: false }),
    supabase.from('matters').select('id, file_ref, title, client_id, client:clients(name)').is('deleted_at', null).order('file_ref'),
    supabase.from('documents').select('id, filename, file_size, case_event_id').not('case_event_id', 'is', null).is('deleted_at', null),
    supabase
      .from('documents')
      .select('id, filename, file_size, created_at, category:document_categories(name), matter:matters(id, file_ref, title)')
      .in('category_id', ahCatIds.length ? ahCatIds : ['00000000-0000-0000-0000-000000000000'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  const matterOptions = (matters ?? []).map((m) => {
    const c = Array.isArray(m.client) ? m.client[0] : m.client
    return { id: m.id, file_ref: m.file_ref, title: m.title, client_id: m.client_id ?? '', client_name: c?.name ?? '' }
  })

  const appellateDocs = (ahDocs ?? []).map((d) => {
    const cat = Array.isArray(d.category) ? d.category[0] ?? null : d.category
    const m = Array.isArray(d.matter) ? d.matter[0] ?? null : d.matter
    return { ...d, category: cat, matter: m }
  }) as AppellateDoc[]

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
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Remote</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Zoom Sessions
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Every Zoom session attendance sheet — appellate court, trial / committal
          court and remand. Each follows the firm’s Zoom template and links to its
          case file, calendar and documents, exactly like the attendance sheets.
        </p>
      </header>

      <AttendanceRegister rows={rows} matters={matterOptions} templates={ZOOM_TEMPLATES} attachmentsByEvent={attachmentsByEvent} />

      <ZoomDocuments documents={appellateDocs} matters={matterOptions} categories={ahCats ?? []} />
    </div>
  )
}
