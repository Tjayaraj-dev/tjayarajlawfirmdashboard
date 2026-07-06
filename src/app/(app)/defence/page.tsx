import { createClient } from '@/lib/supabase/server'
import { DefenceRegister, type DefenceMatterRow } from '@/components/app/defence/defence-register'

export default async function DefencePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('matters')
    .select('id, file_ref, title, client:clients(name), case_type:case_types(name)')
    .is('deleted_at', null)
    .order('next_hearing_at', { ascending: true, nullsFirst: false })

  const matters = (data ?? []).map((m) => {
    const c = Array.isArray(m.client) ? m.client[0] : m.client
    const ct = Array.isArray(m.case_type) ? m.case_type[0] : m.case_type
    return {
      id: m.id,
      file_ref: m.file_ref,
      title: m.title,
      client_name: c?.name ?? '—',
      case_type_name: ct?.name ?? '',
    }
  }) as DefenceMatterRow[]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Portfolio</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Defence Case
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Open a case to work its defence file — the witness list, exhibit list
          and the full case-file index (51A / 51B). Everything links back to the
          matter, client and calendar.
        </p>
      </header>

      <DefenceRegister matters={matters} />
    </div>
  )
}
