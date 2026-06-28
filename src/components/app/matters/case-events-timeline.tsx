'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EventLogDialog } from './event-log-dialog'
import { softDeleteCaseEvent, hardDeleteCaseEvent } from '@/lib/case-events/actions'
import {
  EVENT_TYPE_MAP,
  type CaseEventType,
} from '@/lib/case-events/config'
import type { Database } from '@/lib/supabase/database.types'

type CaseEventRow = Database['public']['Tables']['case_events']['Row']

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function detailPairs(type: CaseEventType, details: Record<string, string>) {
  const cfg = EVENT_TYPE_MAP[type]
  return cfg.fields
    .filter((f) => f.detail && details[f.key])
    .map((f) => ({ label: f.label, value: details[f.key] }))
}

function EventCard({
  event,
  matterId,
  isAdmin,
}: {
  event: CaseEventRow
  matterId: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const cfg = EVENT_TYPE_MAP[event.event_type]
  const details = (event.details ?? {}) as Record<string, string>
  const pairs = detailPairs(event.event_type, details)

  const remove = () => {
    if (!confirm('Archive this event? It is hidden, not destroyed.')) return
    startTransition(async () => {
      const { error } = await softDeleteCaseEvent(event.id, matterId)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Event archived')
      router.refresh()
    })
  }

  const destroy = () => {
    if (!confirm('Permanently delete this event? It cannot be undone.')) return
    startTransition(async () => {
      const { error } = await hardDeleteCaseEvent(event.id, matterId)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Event permanently deleted')
      router.refresh()
    })
  }

  return (
    <li className="relative pl-6">
      <span className="absolute left-0 top-1.5 size-2.5 -translate-x-1/2 rounded-full border-2 border-brand-gold bg-white" />
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="outline" className="border-brand-navy/15 text-[10px] uppercase tracking-wide text-brand-navy">
              {cfg.label}
            </Badge>
            <p className="mt-1 text-sm font-medium text-brand-navy">
              {fmtDateTime(event.occurred_at)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground" disabled={pending} />}
            >
              <MoreHorizontal className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={remove} className="text-destructive">
                <Archive className="size-3.5" /> Archive
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={destroy} className="text-destructive">
                    <Trash2 className="size-3.5" /> Delete permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {event.counsel && <Pair label="Counsel" value={event.counsel} />}
          {event.coram && <Pair label="Coram" value={event.coram} />}
          {event.set_for && <Pair label="Set for" value={event.set_for} />}
          {pairs.map((p) => (
            <Pair key={p.label} label={p.label} value={p.value} />
          ))}
        </div>

        {event.notes && (
          <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm text-muted-foreground">
            {event.notes}
          </p>
        )}

        {event.next_date && (
          <p className="mt-3 text-xs">
            <span className="text-muted-foreground">Next: </span>
            <span className="font-medium text-brand-navy">{fmtDate(event.next_date)}</span>
            {event.next_set_for && (
              <span className="text-muted-foreground"> · {event.next_set_for}</span>
            )}
          </p>
        )}
      </div>
    </li>
  )
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-brand-navy">{value}</span>
    </p>
  )
}

export function CaseEventsTimeline({
  matterId,
  events,
  isAdmin,
}: {
  matterId: string
  events: CaseEventRow[]
  isAdmin: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-light text-brand-navy">
          Events &amp; attendances
        </h2>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="size-4" /> Log event
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No events logged yet. Record a court attendance, prison visit, interview
          or proceeding.
        </p>
      ) : (
        <ul className="space-y-4 border-l border-border/70 pl-1">
          {events.map((e) => (
            <EventCard key={e.id} event={e} matterId={matterId} isAdmin={isAdmin} />
          ))}
        </ul>
      )}

      <EventLogDialog open={open} onOpenChange={setOpen} matterId={matterId} />
    </div>
  )
}
