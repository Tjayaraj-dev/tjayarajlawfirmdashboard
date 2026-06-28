import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { LookupManager } from '@/components/app/lookups/lookup-manager'

export default async function CaseTypesPage() {
  const session = await getCurrentUser()
  if (!isAdmin(session?.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data } = await supabase.from('case_types').select('id, name, slug').order('name')

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Configuration</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Case Types
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          The firm’s practice areas — used to categorise every matter. Populate
          these once the firm confirms its taxonomy.
        </p>
      </header>
      <LookupManager table="case_types" rows={data ?? []} />
    </div>
  )
}
