'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { urgencyOf, URGENCY_RING } from '@/lib/calendar/urgency'
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

  return (
    <Popover>
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
        <Link
          href={`/matters/${item.matterId}`}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-navy hover:text-brand-gold"
        >
          View matter <ArrowRight className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  )
}
