import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WitnessList, type WitnessRow } from '@/components/app/defence/witness-list'
import { ExhibitList, type ExhibitRow } from '@/components/app/defence/exhibit-list'
import { DefenceDocuments, type DefenceDoc } from '@/components/app/defence/defence-documents'
import { DEFENCE_CATEGORY_SLUGS } from '@/lib/defence/config'

export default async function DefenceCasePage({
  params,
}: {
  params: Promise<{ matterId: string }>
}) {
  const { matterId } = await params
  const supabase = await createClient()

  const { data: matter } = await supabase
    .from('matters')
    .select('id, file_ref, title, client:clients(name), case_type:case_types(name)')
    .eq('id', matterId)
    .single()

  if (!matter) notFound()

  const client = Array.isArray(matter.client) ? matter.client[0] : matter.client
  const caseType = Array.isArray(matter.case_type) ? matter.case_type[0] : matter.case_type

  const { data: defCatData } = await supabase
    .from('document_categories')
    .select('id, name, slug')
    .in('slug', DEFENCE_CATEGORY_SLUGS)
  // Preserve the paper index order (not alphabetical).
  const defCats = (defCatData ?? []).sort(
    (a, b) => DEFENCE_CATEGORY_SLUGS.indexOf(a.slug) - DEFENCE_CATEGORY_SLUGS.indexOf(b.slug)
  )
  const defCatIds = defCats.map((c) => c.id)

  const [{ data: witnesses }, { data: exhibits }, { data: docs }] = await Promise.all([
    supabase.from('witnesses').select('id, name, role, date_presented, status').eq('matter_id', matterId).is('deleted_at', null).order('created_at'),
    supabase.from('exhibits').select('id, marking, date_presented, through_witness, description').eq('matter_id', matterId).is('deleted_at', null).order('created_at'),
    supabase
      .from('documents')
      .select('id, filename, file_size, created_at, category_id')
      .eq('matter_id', matterId)
      .in('category_id', defCatIds.length ? defCatIds : ['00000000-0000-0000-0000-000000000000'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  const docsByCategory: Record<string, DefenceDoc[]> = {}
  for (const d of docs ?? []) {
    if (d.category_id) (docsByCategory[d.category_id] ??= []).push({
      id: d.id,
      filename: d.filename,
      file_size: d.file_size,
      created_at: d.created_at,
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-6 py-10 lg:px-10">
      <div>
        <Link href="/defence" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand-navy">
          <ChevronLeft className="size-3.5" /> Defence cases
        </Link>
        <header className="mt-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-brand-gold">{matter.file_ref}</span>
            {caseType?.name && <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{caseType.name}</span>}
          </div>
          <h1 className="mt-2 font-display text-3xl font-light tracking-tight text-brand-navy">{matter.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client?.name ?? 'Unassigned'} ·{' '}
            <Link href={`/matters/${matter.id}`} className="text-brand-gold hover:underline">open matter</Link>
          </p>
        </header>
      </div>

      <WitnessList matterId={matterId} witnesses={(witnesses ?? []) as WitnessRow[]} />
      <ExhibitList matterId={matterId} exhibits={(exhibits ?? []) as ExhibitRow[]} />
      <DefenceDocuments matterId={matterId} categories={defCats} docsByCategory={docsByCategory} />
    </div>
  )
}
