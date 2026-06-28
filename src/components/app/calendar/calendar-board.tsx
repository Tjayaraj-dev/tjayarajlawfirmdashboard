'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EventLogDialog, type MatterOption } from '@/components/app/matters/event-log-dialog'

export type CalendarItem = {
  id: string
  date: string // YYYY-MM-DD
  time: string | null // HH:mm
  label: string
  fileRef: string
  matterId: string
  kind: string
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const KIND_DOT: Record<string, string> = {
  Hearing: 'bg-emerald-500',
  'Court attendance': 'bg-emerald-500',
  'Zoom session': 'bg-blue-500',
  'Prison attendance': 'bg-amber-500',
  'Client interview': 'bg-violet-500',
  'Minutes of proceedings': 'bg-rose-500',
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CalendarBoard({
  items,
  matters,
}: {
  items: CalendarItem[]
  matters: MatterOption[]
}) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [logOpen, setLogOpen] = useState(false)

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

  const todayStr = dateStr(today)
  const move = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-light text-brand-navy">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setLogOpen(true)} disabled={matters.length === 0}>
            <Plus className="size-4" /> Log event
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
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
            const inMonth = d.getMonth() === cursor.getMonth()
            const dayItems = byDate.get(ds) ?? []
            const isToday = ds === todayStr
            return (
              <div
                key={i}
                className={cn(
                  'min-h-24 border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                  !inMonth && 'bg-muted/20'
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
                  {dayItems.map((it) => (
                    <Link
                      key={it.id}
                      href={`/matters/${it.matterId}`}
                      className="block rounded border border-border/60 bg-white px-1.5 py-1 text-[11px] leading-tight transition-colors hover:border-brand-gold/50 hover:bg-brand-gold/5"
                    >
                      <span className="flex items-center gap-1">
                        <span className={cn('size-1.5 shrink-0 rounded-full', KIND_DOT[it.kind] ?? 'bg-muted-foreground')} />
                        {it.time && <span className="font-medium text-brand-navy">{it.time}</span>}
                        <span className="truncate font-mono text-[10px] text-brand-gold">{it.fileRef}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-muted-foreground">{it.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}
