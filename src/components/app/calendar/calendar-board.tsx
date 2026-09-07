'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventLogDialog, type MatterOption } from '@/components/app/matters/event-log-dialog'
import { QuickScheduleDialog } from './quick-schedule-dialog'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { scheduleNextHearing } from '@/lib/matters/actions'
import { rescheduleCaseEvent } from '@/lib/case-events/actions'
import type { CaseEventType } from '@/lib/case-events/config'

export type CalendarEventDetail = {
  occurred_at: string
  counsel: string | null
  coram: string | null
  set_for: string | null
  next_date: string | null
  next_set_for: string | null
  notes: string | null
  details: unknown
  event_type: CaseEventType
}

export type CalendarItem = {
  id: string
  date: string // YYYY-MM-DD
  time: string | null // HH:mm
  label: string
  fileRef: string
  matterId: string
  kind: string
  // Present only for ev-* items — the full case_events row, for editing.
  rawEvent?: CalendarEventDetail
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

type View = 'month' | 'week' | 'day'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function headerLabel(cursor: Date, view: View): string {
  if (view === 'day') {
    return cursor.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (view === 'week') {
    const monday = new Date(cursor)
    monday.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const sameMonth = monday.getMonth() === sunday.getMonth()
    return sameMonth
      ? `${MONTHS[monday.getMonth()]} ${monday.getDate()}–${sunday.getDate()}, ${monday.getFullYear()}`
      : `${MONTHS[monday.getMonth()]} ${monday.getDate()} – ${MONTHS[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`
  }
  return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
}

export function CalendarBoard({
  items,
  matters,
}: {
  items: CalendarItem[]
  matters: MatterOption[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [logOpen, setLogOpen] = useState(false)
  const [quickScheduleDate, setQuickScheduleDate] = useState<string | null>(null)

  // Require real pointer movement before a drag starts — otherwise dnd-kit
  // treats every click (mousedown/mouseup with near-zero jitter) as a drag
  // attempt and the popover/edit click never fires.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const it of items) {
      const arr = map.get(it.date) ?? []
      arr.push(it)
      map.set(it.date, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
    }
    return map
  }, [items])

  const todayStr = dateStr(today)

  const move = (delta: number) => {
    setCursor((c) => {
      if (view === 'day') {
        const d = new Date(c)
        d.setDate(d.getDate() + delta)
        return d
      }
      if (view === 'week') {
        const d = new Date(c)
        d.setDate(d.getDate() + delta * 7)
        return d
      }
      return new Date(c.getFullYear(), c.getMonth() + delta, 1)
    })
  }

  const goToday = () => setCursor(view === 'month' ? new Date(today.getFullYear(), today.getMonth(), 1) : new Date(today))

  const handleDragEnd = (event: DragEndEvent) => {
    const itemId = event.active.id as string
    const newDate = event.over?.id as string | undefined
    if (!newDate) return
    const item = items.find((i) => i.id === itemId)
    if (!item || item.date === newDate) return

    startTransition(async () => {
      const result = itemId.startsWith('mt-')
        ? await scheduleNextHearing(item.matterId, newDate, item.time ?? '09:00')
        : await rescheduleCaseEvent(itemId.slice(3), newDate)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Rescheduled')
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-light text-brand-navy">
          {headerLabel(cursor, view)}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView((v as View) ?? 'month')}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" onClick={() => setLogOpen(true)} disabled={matters.length === 0}>
            <Plus className="size-4" /> Log event
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" className="size-8 p-0" onClick={() => move(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="size-8 p-0" onClick={() => move(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <EventLogDialog open={logOpen} onOpenChange={setLogOpen} matters={matters} />
      {quickScheduleDate && (
        <QuickScheduleDialog
          open={!!quickScheduleDate}
          onOpenChange={(open) => !open && setQuickScheduleDate(null)}
          matters={matters}
          defaultDate={quickScheduleDate}
        />
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {view === 'month' && (
          <MonthView cursor={cursor} byDate={byDate} todayStr={todayStr} onEmptyClick={setQuickScheduleDate} />
        )}
        {view === 'week' && (
          <WeekView cursor={cursor} byDate={byDate} todayStr={todayStr} onEmptyClick={setQuickScheduleDate} />
        )}
        {view === 'day' && (
          <DayView cursor={cursor} byDate={byDate} todayStr={todayStr} onEmptyClick={setQuickScheduleDate} />
        )}
      </DndContext>
    </div>
  )
}
