import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { MattersTable, type MatterRow } from '@/components/app/matters/matters-table'

export default async function MattersPage() {
  const [session, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ])

  // RLS scopes these. Client name is embedded for display + search.
  const [{ data: matterData }, { data: clientData }, { data: caseTypeData }, { data: courtData }] =
    await Promise.all([
      supabase
        .from('matters')
        .select('*, client:clients(name)')
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('next_hearing_at', { ascending: true, nullsFirst: false }),
      supabase.from('clients').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('case_types').select('id, name, slug').order('name'),
      supabase.from('courts').select('id, name').order('name'),
    ])

  const matters = (matterData ?? []) as MatterRow[]
  const clients = clientData ?? []
  const caseTypes = caseTypeData ?? []
  const courts = courtData ?? []
  const admin = isAdmin(session?.role)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
          Case Ledger
        </p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Matters
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Every case file the firm holds — references, courts, hearings and the
          parties involved.
        </p>
      </header>

      <MattersTable matters={matters} clients={clients} caseTypes={caseTypes} courts={courts} isAdmin={admin} />
    </div>
  )
}
