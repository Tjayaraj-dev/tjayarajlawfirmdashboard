import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { Badge } from '@/components/ui/badge'
import { CaseEventsTimeline } from '@/components/app/matters/case-events-timeline'
import { DocumentsPanel } from '@/components/app/matters/documents-panel'
import { MATTER_STATUSES } from '@/lib/matters/schema'
import { caseTypeFields, APPOINTMENT_TYPES } from '@/lib/matters/case-type-config'

const STATUS_LABELS = Object.fromEntries(
  MATTER_STATUSES.map((s) => [s.value, s.label])
)
const APPOINTMENT_LABELS = Object.fromEntries(
  APPOINTMENT_TYPES.map((a) => [a.value, a.label])
)

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-brand-navy">{value}</dd>
    </div>
  )
}

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, session] = await Promise.all([createClient(), getCurrentUser()])
  const admin = isAdmin(session?.role)

  const { data: matter } = await supabase
    .from('matters')
    .select('*, client:clients(name), case_type:case_types(name, slug)')
    .eq('id', id)
    .single()

  if (!matter) notFound()

  const caseType = Array.isArray(matter.case_type) ? matter.case_type[0] : matter.case_type
  const custom = (matter.custom_fields ?? {}) as Record<string, string>

  const [{ data: eventData }, { data: docData }, { data: catData }] =
    await Promise.all([
      supabase
        .from('case_events')
        .select('*')
        .eq('matter_id', id)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false }),
      supabase
        .from('documents')
        .select('*, category:document_categories(name)')
        .eq('matter_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('document_categories').select('id, name').order('name'),
    ])

  const events = eventData ?? []
  const documents = (docData ?? []).filter((d) => !d.case_event_id)
  const categories = catData ?? []

  // Documents attached to a specific event, grouped by event id.
  const attachmentsByEvent: Record<string, { id: string; filename: string; file_size: number | null }[]> = {}
  for (const d of docData ?? []) {
    if (d.case_event_id) {
      ;(attachmentsByEvent[d.case_event_id] ??= []).push({
        id: d.id,
        filename: d.filename,
        file_size: d.file_size,
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
      <Link
        href="/matters"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <ChevronLeft className="size-3.5" /> Matters
      </Link>

      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-brand-gold">{matter.file_ref}</span>
          <Badge variant="outline" className="text-[10px]">
            {STATUS_LABELS[matter.status]}
          </Badge>
        </div>
        <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-brand-navy">
          {matter.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {matter.client?.name ?? 'Unassigned client'}
        </p>
      </header>

      <dl className="mb-10 grid gap-5 rounded-lg border bg-white p-6 sm:grid-cols-3">
        <DetailRow label="Case type" value={caseType?.name ?? null} />
        <DetailRow label="Appointment" value={APPOINTMENT_LABELS[matter.appointment_type ?? ''] ?? null} />
        <DetailRow label="Court" value={matter.court} />
        {caseTypeFields(caseType?.slug).map((f) => (
          <DetailRow key={f.key} label={f.label} value={custom[f.key] ?? null} />
        ))}
        <DetailRow label="Notes / description" value={matter.description} />
      </dl>

      <CaseEventsTimeline matterId={id} events={events} isAdmin={admin} attachmentsByEvent={attachmentsByEvent} />

      <div className="mt-12">
        <DocumentsPanel matterId={id} documents={documents} categories={categories} isAdmin={admin} />
      </div>
    </div>
  )
}
