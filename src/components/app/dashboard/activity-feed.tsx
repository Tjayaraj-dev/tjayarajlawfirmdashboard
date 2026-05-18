import { formatDistanceToNow } from 'date-fns'
import {
  FileUp,
  FolderPlus,
  UserPlus,
  CalendarClock,
  StickyNote,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { activity, type ActivityKind } from '@/lib/mock/data'

const ICON_BY_KIND: Record<ActivityKind, LucideIcon> = {
  doc_uploaded: FileUp,
  matter_opened: FolderPlus,
  client_added: UserPlus,
  hearing_rescheduled: CalendarClock,
  note_added: StickyNote,
  matter_closed: CheckCircle2,
}

const LABEL_BY_KIND: Record<ActivityKind, string> = {
  doc_uploaded: 'uploaded a document',
  matter_opened: 'opened a matter',
  client_added: 'added a client',
  hearing_rescheduled: 'rescheduled a hearing',
  note_added: 'added a note',
  matter_closed: 'closed a matter',
}

export function ActivityFeed() {
  return (
    <section
      className="rounded-lg border border-brand-navy/10 bg-white shadow-[0_1px_3px_rgba(15,23,50,0.04)]"
      style={{ animation: 'fade-up 700ms ease-out 350ms both' }}
    >
      <header className="flex items-baseline justify-between border-b border-brand-navy/10 px-6 py-4">
        <h2 className="font-display text-lg font-medium text-brand-navy">
          Activity
        </h2>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Recent
        </p>
      </header>

      <ol className="divide-y divide-brand-navy/[0.06]">
        {activity.map((entry) => {
          const Icon = ICON_BY_KIND[entry.kind]
          const ago = formatDistanceToNow(new Date(entry.at), { addSuffix: true })
          return (
            <li key={entry.id} className="flex items-start gap-3 px-6 py-3.5">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-brand-navy/[0.08] bg-brand-navy/[0.025] text-brand-navy/70">
                <Icon className="size-3.5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-brand-navy">
                  <span className="font-medium">{entry.actor}</span>{' '}
                  <span className="text-muted-foreground">
                    {LABEL_BY_KIND[entry.kind]}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  <span className="italic text-brand-navy/70">
                    {entry.detail}
                  </span>
                  {entry.matterRef && (
                    <>
                      <span className="mx-1.5 text-muted-foreground/40">
                        ·
                      </span>
                      <span className="font-mono text-[10px]">
                        {entry.matterRef}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                  {ago}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
