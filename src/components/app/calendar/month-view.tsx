'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { EventChip } from './event-chip'
import { useDayDrop } from './use-day-drop'
import type { CalendarItem } from './calendar-board'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function DayCell({
  d,
  inMonth,
  isToday,
  items,
  todayStr,
  onEmptyClick,
}: {
  d: Date
  inMonth: boolean
  isToday: boolean
  items: CalendarItem[]
  todayStr: string
  onEmptyClick: (dateStr: string) => void
}) {
  const ds = dateStr(d)
  const { isOver, dropRef } = useDayDrop(ds)

  return (
    <div
      ref={dropRef}
      onClick={() => onEmptyClick(ds)}
      className={cn(
        'min-h-24 cursor-pointer border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0',
        !inMonth && 'bg-muted/20',
        isOver && 'ring-2 ring-inset ring-brand-gold'
      )}
    >
      <div className="flex justify-end">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs',
            isToday ? 'bg-brand-navy font-medium text-white' : 'text-muted-foreground',
            !inMonth && !isToday && 'opacity-40'
          )}
        >
          {d.getDate()}
        </span>
      </div>
      <div className="mt-1 space-y-1">
        {items.map((it) => (
          <EventChip key={it.id} item={it} todayStr={todayStr} />
        ))}
      </div>
    </div>
  )
}

export function MonthView({
  cursor,
  byDate,
  todayStr,
  onEmptyClick,
}: {
  cursor: Date
  byDate: Map<string, CalendarItem[]>
  todayStr: string
  onEmptyClick: (dateStr: string) => void
}) {
  // Monday-start 6-week grid covering the visible month.
  const cells = useMemo(() => {
    const firstWeekday = (cursor.getDay() + 6) % 7 // Mon=0
    const start = new Date(cursor)
    start.setDate(1 - firstWeekday)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const ds = dateStr(d)
            return (
              <DayCell
                key={i}
                d={d}
                inMonth={d.getMonth() === cursor.getMonth()}
                isToday={ds === todayStr}
                items={byDate.get(ds) ?? []}
                todayStr={todayStr}
                onEmptyClick={onEmptyClick}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
