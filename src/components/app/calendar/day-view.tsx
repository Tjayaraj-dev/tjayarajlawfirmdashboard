'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { EventChip } from './event-chip'
import { useDayDrop } from './use-day-drop'
import type { CalendarItem } from './calendar-board'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DayView({
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
  const ds = dateStr(cursor)
  const { isOver, dropRef } = useDayDrop(ds)

  const { allDay, timed } = useMemo(() => {
    const items = byDate.get(ds) ?? []
    return {
      allDay: items.filter((it) => !it.time),
      timed: items.filter((it) => it.time),
    }
  }, [byDate, ds])

  return (
    <div
      ref={dropRef}
      onClick={() => onEmptyClick(ds)}
      className={cn(
        'min-h-96 cursor-pointer rounded-lg border bg-white p-4',
        isOver && 'ring-2 ring-inset ring-brand-gold'
      )}
    >
      {allDay.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">All day</p>
          <div className="space-y-1.5">
            {allDay.map((it) => (
              <EventChip key={it.id} item={it} todayStr={todayStr} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {timed.length === 0 && allDay.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing scheduled. Click to add a hearing.
          </p>
        )}
        {timed.map((it) => (
          <EventChip key={it.id} item={it} todayStr={todayStr} />
        ))}
      </div>
    </div>
  )
}
