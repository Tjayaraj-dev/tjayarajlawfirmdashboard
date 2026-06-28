import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { ClientsTable, type ClientRow } from '@/components/app/clients/clients-table'

export default async function ClientsPage() {
  const [session, supabase] = await Promise.all([
    getCurrentUser(),
    createClient(),
  ])

  // RLS scopes this: staff see live rows only; admin sees archived too.
  const [{ data }, { data: caseTypeData }] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .order('deleted_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false }),
    supabase.from('case_types').select('id, name').order('name'),
  ])

  const clients = (data ?? []) as ClientRow[]
  const caseTypes = caseTypeData ?? []
  const admin = isAdmin(session?.role)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
          Client Vault
        </p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Clients
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Individuals and corporate entities the firm acts for. Archived records
          are retained{admin ? ' and restorable by admins' : ''}.
        </p>
      </header>

      <ClientsTable clients={clients} caseTypes={caseTypes} isAdmin={admin} />
    </div>
  )
}
