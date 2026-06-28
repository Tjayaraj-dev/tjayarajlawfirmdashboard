import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { MfaCard } from '@/components/app/settings/mfa-card'
import { FirmSettingsForm } from '@/components/app/settings/firm-settings-form'
import { ReadOnlyCard } from '@/components/app/settings/read-only-card'

export default async function SettingsPage() {
  const session = await getCurrentUser()
  const admin = isAdmin(session?.role)

  let firm = null
  if (admin) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('firm_settings')
      .select('name, bar_council_no, sender_email, primary_hex, retention_years, read_only')
      .eq('id', true)
      .single()
    firm = data
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Settings
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Signed in as {session?.name} · {session?.email}
        </p>
      </header>

      {admin && firm && (
        <section className="mb-10 space-y-4">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Firm
          </h2>
          <FirmSettingsForm
            initial={{
              name: firm.name ?? '',
              bar_council_no: firm.bar_council_no ?? '',
              sender_email: firm.sender_email ?? '',
              primary_hex: firm.primary_hex ?? '#1e3a5f',
              retention_years: firm.retention_years ?? 7,
            }}
          />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Security
        </h2>
        <MfaCard required={admin} />
        {admin && firm && <ReadOnlyCard active={firm.read_only} />}
      </section>
    </div>
  )
}
