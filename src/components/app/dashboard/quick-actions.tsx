import { FolderPlus, UserPlus, FileUp } from 'lucide-react'

const ACTIONS = [
  {
    label: 'New Matter',
    blurb: 'Open a case file',
    icon: FolderPlus,
  },
  {
    label: 'New Client',
    blurb: 'Add a client record',
    icon: UserPlus,
  },
  {
    label: 'Upload Document',
    blurb: 'To an existing matter',
    icon: FileUp,
  },
] as const

export function QuickActions() {
  return (
    <section
      className="rounded-lg border border-brand-gold/30 bg-brand-gold/[0.04] p-1"
      style={{ animation: 'fade-up 800ms ease-out 550ms both' }}
    >
      <div className="grid grid-cols-1 divide-y divide-brand-gold/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className="group flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-brand-gold/[0.06]"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-brand-gold/30 bg-white/40 text-brand-gold transition-colors group-hover:bg-brand-gold/15">
              <a.icon className="size-4" strokeWidth={1.5} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm font-medium text-brand-navy">
                {a.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{a.blurb}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
