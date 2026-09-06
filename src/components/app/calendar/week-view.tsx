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

function WeekDayColumn({
  d,
  isToday,
  items,
  todayStr,
  onEmptyClick,
}: {
  d: Date
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
        'min-h-72 cursor-pointer border-r p-2 last:border-r-0',
        isOver && 'ring-2 ring-inset ring-brand-gold'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {WEEKDAYS[(d.getDay() + 6) % 7]}
        </span>
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs',
            isToday ? 'bg-brand-navy font-medium text-white' : 'text-muted-foreground'
          )}
        >
          {d.getDate()}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <EventChip key={it.id} item={it} todayStr={todayStr} />
        ))}
      </div>
    </div>
  )
}

export function WeekView({
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
  const days = useMemo(() => {
    const monday = new Date(cursor)
    monday.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [cursor])

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div className="grid min-w-[840px] grid-cols-7">
        {days.map((d, i) => {
          const ds = dateStr(d)
          return (
            <WeekDayColumn
              key={i}
              d={d}
              isToday={ds === todayStr}
              items={byDate.get(ds) ?? []}
              todayStr={todayStr}
              onEmptyClick={onEmptyClick}
            />
          )
        })}
      </div>
    </div>
  )
}
