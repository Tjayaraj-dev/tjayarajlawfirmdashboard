import Link from 'next/link'

export type RecentMatterRow = {
  id: string
  fileRef: string
  title: string
  clientName: string
  statusLabel: string
  practiceArea: string
  assignedInitials: string
  assignedName: string
}

const STATUS_STYLE: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10',
  'On hold': 'bg-amber-50 text-amber-700 ring-1 ring-amber-700/10',
  'Pending filing': 'bg-brand-gold/15 text-brand-gold-foreground ring-1 ring-brand-gold/30',
  Closed: 'bg-slate-50 text-slate-600 ring-1 ring-slate-600/10',
}

export function RecentMatters({ recent }: { recent: RecentMatterRow[] }) {

  return (
    <section
      className="rounded-lg border border-brand-navy/10 bg-white shadow-[0_1px_3px_rgba(15,23,50,0.04)]"
      style={{ animation: 'fade-up 750ms ease-out 450ms both' }}
    >
      <header className="flex items-baseline justify-between border-b border-brand-navy/10 px-6 py-4">
        <h2 className="font-display text-lg font-medium text-brand-navy">
          Recent Matters
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Last opened
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-navy/[0.06] text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <th className="px-6 py-3 text-left font-medium">File ref</th>
              <th className="px-3 py-3 text-left font-medium">Matter</th>
              <th className="hidden px-3 py-3 text-left font-medium md:table-cell">
                Type
              </th>
              <th className="px-3 py-3 text-left font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy/[0.05]">
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  No matters yet.
                </td>
              </tr>
            )}
            {recent.map((m) => (
              <tr
                key={m.id}
                className="transition-colors hover:bg-brand-navy/[0.02]"
              >
                <td className="px-6 py-3 font-mono text-xs text-brand-navy/80">
                  <Link href={`/matters/${m.id}`} className="hover:text-brand-gold hover:underline">
                    {m.fileRef}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <p className="truncate font-display italic text-brand-navy">
                    {m.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.clientName}
                  </p>
                </td>
                <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                  {m.practiceArea}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${STATUS_STYLE[m.statusLabel] ?? STATUS_STYLE.Closed}`}
                  >
                    {m.statusLabel}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <span
                    title={m.assignedName}
                    className="inline-flex size-7 items-center justify-center rounded-full border border-brand-navy/15 bg-brand-navy/[0.04] font-display text-[10px] text-brand-navy"
                  >
                    {m.assignedInitials}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
