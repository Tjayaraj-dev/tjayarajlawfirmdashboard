'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { urgencyOf, URGENCY_RING } from '@/lib/calendar/urgency'
import { EventPopover } from './event-popover'
import type { CalendarItem } from './calendar-board'

const KIND_DOT: Record<string, string> = {
  Hearing: 'bg-emerald-500',
  'Court attendance': 'bg-emerald-500',
  'Zoom session': 'bg-blue-500',
  'Prison attendance': 'bg-amber-500',
  'Client interview': 'bg-violet-500',
  'Minutes of proceedings': 'bg-rose-500',
}

// Shared by month/week/day cells: draggable trigger + popover, one urgency
// treatment, so none of the three views re-implements chip behavior.
export function EventChip({ item, todayStr }: { item: CalendarItem; todayStr: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id })
  const urgency = urgencyOf(item.date, todayStr)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => e.stopPropagation()}
      className={cn(isDragging && 'opacity-40')}
    >
      <EventPopover
        item={item}
        todayStr={todayStr}
        className={cn(
          'rounded border border-border/60 bg-white px-1.5 py-1 text-[11px] leading-tight transition-colors hover:border-brand-gold/50 hover:bg-brand-gold/5 cursor-grab active:cursor-grabbing',
          URGENCY_RING[urgency]
        )}
      >
        <span className="flex items-center gap-1">
          <span className={cn('size-1.5 shrink-0 rounded-full', KIND_DOT[item.kind] ?? 'bg-muted-foreground')} />
          {item.time && <span className="font-medium text-brand-navy">{item.time}</span>}
          <span className="truncate font-mono text-[10px] text-brand-gold">{item.fileRef}</span>
        </span>
        <span className="mt-0.5 block truncate text-muted-foreground">{item.label}</span>
      </EventPopover>
    </div>
  )
}
