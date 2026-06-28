import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin, type Role } from '@/lib/auth/roles'
import { UsersTable } from '@/components/app/users/users-table'

export default async function UsersPage() {
  const session = await getCurrentUser()
  if (!isAdmin(session?.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name')

  const users = (data ?? []) as {
    id: string
    full_name: string
    email: string
    role: Role
  }[]

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Access</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Users
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          The firm’s lawyers and clerks. Each has their own login — access is
          enforced by row-level security. New accounts are invited from the
          Supabase project; roles are managed here.
        </p>
      </header>

      <UsersTable users={users} currentUserId={session!.id} />
    </div>
  )
}
