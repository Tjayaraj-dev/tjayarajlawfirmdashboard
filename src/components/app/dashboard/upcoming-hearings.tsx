export type HearingRow = {
  matterId: string
  fileRef: string
  title: string
  clientName: string
  date: string
  time: string
  kind: string
  court: string
}

function groupByDay(rows: HearingRow[]) {
  const map = new Map<string, HearingRow[]>()
  for (const r of rows) {
    const arr = map.get(r.date) ?? []
    arr.push(r)
    map.set(r.date, arr)
  }
  return Array.from(map.entries())
}

function formatDay(dateStr: string): {
  weekday: string
  day: string
  month: string
  isUrgent: boolean
} {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return {
    weekday: d.toLocaleDateString('en-MY', { weekday: 'short' }).toUpperCase(),
    day: String(d.getDate()),
    month: d.toLocaleDateString('en-MY', { month: 'short' }).toUpperCase(),
    isUrgent: diffHours < 24,
  }
}

export function UpcomingHearings({ rows }: { rows: HearingRow[] }) {
  const groups = groupByDay(rows)

  return (
    <section
      className="rounded-lg border border-brand-navy/10 bg-white shadow-[0_1px_3px_rgba(15,23,50,0.04)]"
      style={{ animation: 'fade-up 700ms ease-out 250ms both' }}
    >
      <header className="flex items-baseline justify-between border-b border-brand-navy/10 px-6 py-4">
        <h2 className="font-display text-lg font-medium text-brand-navy">
          Upcoming Hearings
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Next 14 days · {rows.length}
        </p>
      </header>

      <div className="divide-y divide-brand-navy/[0.06]">
        {groups.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No upcoming hearings scheduled.
          </p>
        )}
        {groups.map(([date, items]) => {
          const day = formatDay(date)
          return (
            <div key={date} className="flex gap-6 px-6 py-4">
              <div className="w-16 shrink-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {day.weekday}
                </p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-light leading-none text-brand-navy">
                    {day.day}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {day.month}
                  </span>
                </p>
                {day.isUrgent && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-sm bg-brand-gold/15 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-brand-gold">
                    <span className="size-1 rounded-full bg-brand-gold" />
                    Today
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                {items.map((r) => (
                  <div key={r.matterId} className="space-y-0.5">
                    <div className="flex items-baseline gap-3">
                      <span className="tabular-nums font-mono text-xs font-medium text-brand-navy">
                        {r.time}
                      </span>
                      <p className="truncate font-display text-base italic text-brand-navy">
                        {r.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="text-[10px] uppercase tracking-[0.2em]">
                        {r.kind}
                      </span>
                      <span className="mx-2 text-muted-foreground/40">·</span>
                      {r.court}
                      <span className="mx-2 text-muted-foreground/40">·</span>
                      <span className="font-mono text-[10px]">{r.fileRef}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
