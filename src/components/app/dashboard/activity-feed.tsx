import { formatDistanceToNow } from 'date-fns'
import {
  FileUp,
  FolderPlus,
  UserPlus,
  CalendarClock,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'

export type ActivityEntry = {
  id: string
  actor: string
  action: string
  resourceType: string
  at: string
}

const ICON_BY_RESOURCE: Record<string, LucideIcon> = {
  clients: UserPlus,
  matters: FolderPlus,
  case_events: CalendarClock,
  documents: FileUp,
}

const NOUN: Record<string, string> = {
  clients: 'a client',
  matters: 'a matter',
  case_events: 'an event',
  documents: 'a document',
}

const VERB: Record<string, string> = {
  create: 'added',
  update: 'updated',
  soft_delete: 'archived',
  restore: 'restored',
  download: 'downloaded',
}

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
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
        {entries.length === 0 && (
          <li className="px-6 py-10 text-center text-sm text-muted-foreground">
            No activity yet.
          </li>
        )}
        {entries.map((entry) => {
          const Icon = ICON_BY_RESOURCE[entry.resourceType] ?? StickyNote
          const ago = formatDistanceToNow(new Date(entry.at), { addSuffix: true })
          const verb = VERB[entry.action] ?? entry.action
          const noun = NOUN[entry.resourceType] ?? entry.resourceType
          return (
            <li key={entry.id} className="flex items-start gap-3 px-6 py-3.5">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-brand-navy/[0.08] bg-brand-navy/[0.025] text-brand-navy/70">
                <Icon className="size-3.5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-brand-navy">
                  <span className="font-medium">{entry.actor}</span>{' '}
                  <span className="text-muted-foreground">
                    {verb} {noun}
                  </span>
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
