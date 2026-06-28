import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { AllDocuments, type AllDocRow } from '@/components/app/documents/all-documents'

export default async function DocumentsPage() {
  const [supabase, session] = await Promise.all([createClient(), getCurrentUser()])
  const admin = isAdmin(session?.role)

  const [{ data }, { data: matters }, { data: categories }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, filename, version, file_size, created_at, category:document_categories(name), matter:matters(id, file_ref, title)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('matters').select('id, file_ref, title').is('deleted_at', null).order('file_ref'),
    supabase.from('document_categories').select('id, name').order('name'),
  ])

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

      <AllDocuments docs={docs} isAdmin={admin} matters={matters ?? []} categories={categories ?? []} />
    </div>
  )
}
