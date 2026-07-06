import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { AllDocuments, type AllDocRow } from '@/components/app/documents/all-documents'
import { APPELLATE_CATEGORY_SLUGS } from '@/lib/documents/appellate'

export default async function DocumentsPage() {
  const [supabase, session] = await Promise.all([createClient(), getCurrentUser()])
  const admin = isAdmin(session?.role)

  // Appellate (A–H) documents live on the Zoom page, not the firm-wide vault.
  const { data: ahCats } = await supabase
    .from('document_categories')
    .select('id')
    .in('slug', APPELLATE_CATEGORY_SLUGS)
  const ahCatIds = (ahCats ?? []).map((c) => c.id)

  let docsQuery = supabase
    .from('documents')
    .select('id, filename, version, file_size, created_at, category:document_categories(name), matter:matters(id, file_ref, title)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (ahCatIds.length) {
    docsQuery = docsQuery.or(`category_id.is.null,category_id.not.in.(${ahCatIds.join(',')})`)
  }

  const [{ data }, { data: matters }, { data: categories }] = await Promise.all([
    docsQuery,
    supabase.from('matters').select('id, file_ref, title, client_id, client:clients(name)').is('deleted_at', null).order('file_ref'),
    supabase.from('document_categories').select('id, name').order('name'),
  ])

  const matterOptions = (matters ?? []).map((m) => {
    const c = Array.isArray(m.client) ? m.client[0] : m.client
    return { id: m.id, file_ref: m.file_ref, title: m.title, client_id: m.client_id ?? '', client_name: c?.name ?? '' }
  })

  const docs = (data ?? []).map((d) => ({
    ...d,
    category: Array.isArray(d.category) ? d.category[0] ?? null : d.category,
    matter: Array.isArray(d.matter) ? d.matter[0] ?? null : d.matter,
  })) as AllDocRow[]

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Vault</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Documents
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Every document across the firm — pleadings, affidavits, KYC, evidence.
          Versioned, signed-URL access only, every download logged.
        </p>
      </header>

      <AllDocuments docs={docs} isAdmin={admin} matters={matterOptions} categories={categories ?? []} />
    </div>
  )
}
