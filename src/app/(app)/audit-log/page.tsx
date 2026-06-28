import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isAdmin } from '@/lib/auth/roles'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  soft_delete: 'bg-amber-50 text-amber-700 border-amber-200',
  restore: 'bg-violet-50 text-violet-700 border-violet-200',
  download: 'bg-slate-100 text-slate-700 border-slate-200',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AuditLogPage() {
  const session = await getCurrentUser()
  if (!isAdmin(session?.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data } = await supabase
    .from('audit_log')
    .select('id, action, resource_type, resource_id, at, actor:profiles(full_name)')
    .order('at', { ascending: false })
    .limit(250)

  const rows = data ?? []

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
          Compliance
        </p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-tight text-brand-navy">
          Audit Log
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Append-only record of every action — who created, edited, archived or
          <span className="font-medium text-brand-navy"> viewed</span> a record,
          and when. The Bar Council answer to “who saw this file.”
        </p>
      </header>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((r) => {
                const actor = Array.isArray(r.actor) ? r.actor[0] : r.actor
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fmt(r.at)}
                    </TableCell>
                    <TableCell className="text-brand-navy">
                      {actor?.full_name ?? 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${ACTION_STYLES[r.action] ?? ''}`}>
                        {r.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.resource_type}
                      {r.resource_id ? ` · ${r.resource_id.slice(0, 8)}` : ''}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
