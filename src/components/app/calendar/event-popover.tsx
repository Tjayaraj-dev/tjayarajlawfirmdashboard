'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { urgencyOf, URGENCY_RING } from '@/lib/calendar/urgency'
import { softDeleteCaseEvent } from '@/lib/case-events/actions'
import { clearNextHearing } from '@/lib/matters/actions'
import { EventLogDialog, caseEventToValues } from '@/components/app/matters/event-log-dialog'
import { QuickScheduleDialog } from './quick-schedule-dialog'
import type { CalendarItem } from './calendar-board'

const KIND_DOT: Record<string, string> = {
  Hearing: 'bg-emerald-500',
  'Court attendance': 'bg-emerald-500',
  'Zoom session': 'bg-blue-500',
  'Prison attendance': 'bg-amber-500',
  'Client interview': 'bg-violet-500',
  'Minutes of proceedings': 'bg-rose-500',
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function EventPopover({
  item,
  todayStr,
  className,
  children,
}: {
  item: CalendarItem
  todayStr: string
  className?: string
  children: React.ReactNode
}) {
  const urgency = urgencyOf(item.date, todayStr)
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const isEvent = item.id.startsWith('ev-')

  const edit = () => {
    setOpen(false)
    setEditOpen(true)
  }

  const remove = () => {
    const message = isEvent
      ? 'Archive this event? It is hidden, not destroyed.'
      : `Remove this hearing from the calendar for ${item.fileRef}?`
    if (!confirm(message)) return

    startTransition(async () => {
      const { error } = isEvent
        ? await softDeleteCaseEvent(item.id.slice(3), item.matterId)
        : await clearNextHearing(item.matterId)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Removed from calendar')
      router.refresh()
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn('block w-full text-left', className)}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex items-center gap-2">
          <span className={cn('size-2 shrink-0 rounded-full', KIND_DOT[item.kind] ?? 'bg-muted-foreground')} />
          <span className="font-mono text-xs text-brand-gold">{item.fileRef}</span>
          {urgency !== 'normal' && (
            <span
              className={cn(
                'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                urgency === 'overdue' && 'bg-red-100 text-red-700',
                urgency === 'critical' && 'bg-red-50 text-red-600',
                urgency === 'soon' && 'bg-amber-50 text-amber-700'
              )}
            >
              {urgency}
            </span>
          )}
        </div>
        <p className={cn('font-display text-base font-medium text-brand-navy', URGENCY_RING[urgency] && 'pl-2')}>
          {item.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.kind} · {formatDate(item.date)}
          {item.time ? ` · ${item.time}` : ' · All day'}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <Link
            href={`/matters/${item.matterId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:text-brand-gold"
          >
            View matter <ArrowRight className="size-3" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={edit}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:text-brand-gold"
            >
              <Pencil className="size-3" /> Edit
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50"
            >
              <Trash2 className="size-3" /> {pending ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </PopoverContent>

      {isEvent && item.rawEvent ? (
        <EventLogDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          matterId={item.matterId}
          editingEvent={{
            id: item.id.slice(3),
            type: item.rawEvent.event_type,
            values: caseEventToValues(item.rawEvent),
          }}
        />
      ) : (
        <QuickScheduleDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          matterId={item.matterId}
          defaultDate={item.date}
          defaultTime={item.time ?? '09:00'}
        />
      )}
    </Popover>
  )
}
