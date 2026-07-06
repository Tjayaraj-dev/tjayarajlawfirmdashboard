'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Paperclip } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EventLogDialog,
  type MatterOption,
} from '@/components/app/matters/event-log-dialog'
import { EventAttachments, type Attachment } from '@/components/app/matters/event-attachments'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  EVENT_TYPE_MAP,
  type CaseEventType,
  type EventTypeConfig,
} from '@/lib/case-events/config'
import { formatDate as fmtDate, formatDateTime as fmtDateTime } from '@/lib/format-date'

export type AttendanceRow = {
  id: string
  event_type: CaseEventType
  occurred_at: string
  counsel: string | null
  next_date: string | null
  matter: { id: string; file_ref: string; title: string; client: { name: string } | null } | null
}

export function AttendanceRegister({
  rows,
  matters,
  templates,
  attachmentsByEvent,
}: {
  rows: AttendanceRow[]
  matters: MatterOption[]
  templates: EventTypeConfig[]
  attachmentsByEvent: Record<string, Attachment[]>
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [attachRow, setAttachRow] = useState<AttendanceRow | null>(null)

  const filtered = useMemo(() => {
    const needle = q.toLowerCase()
    return rows.filter((r) => {
      if (type !== 'all' && r.event_type !== type) return false
      if (!needle) return true
      return [r.matter?.file_ref, r.matter?.title, r.matter?.client?.name, r.counsel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [rows, q, type])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search sheets…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select
            value={type}
            onValueChange={(v) => setType(v ?? 'all')}
            items={[
              { value: 'all', label: 'All templates' },
              ...templates.map((e) => ({ value: e.type, label: e.label })),
            ]}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map((e) => (
                <SelectItem key={e.type} value={e.type}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)} disabled={matters.length === 0}>
          <Plus className="size-4" /> New attendance sheet
        </Button>
      </div>

      {matters.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Open a matter first — every sheet is filed against a case.
        </p>
      )}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Matter</TableHead>
              <TableHead>Counsel</TableHead>
              <TableHead>Next date</TableHead>
              <TableHead>Files</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {fmtDateTime(r.occurred_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-brand-navy/15 text-[10px] text-brand-navy">
                      {EVENT_TYPE_MAP[r.event_type]?.label ?? r.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.matter ? (
                      <Link href={`/matters/${r.matter.id}`} className="hover:underline">
                        <span className="font-mono text-xs text-brand-gold">{r.matter.file_ref}</span>
                        <span className="ml-2 text-sm text-brand-navy">{r.matter.client?.name ?? ''}</span>
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{r.counsel ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(r.next_date)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setAttachRow(r)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-navy"
                    >
                      <Paperclip className="size-3.5" />
                      {(attachmentsByEvent[r.id]?.length ?? 0) || 'Attach'}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No attendance sheets yet. Click “New attendance sheet” to log one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EventLogDialog open={open} onOpenChange={setOpen} matters={matters} templates={templates} />

      <Dialog open={!!attachRow} onOpenChange={(o) => !o && setAttachRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-light text-brand-navy">
              Attachments
            </DialogTitle>
            <DialogDescription>
              {attachRow ? `${EVENT_TYPE_MAP[attachRow.event_type]?.label ?? ''} · ${attachRow.matter?.file_ref ?? ''}` : ''}
            </DialogDescription>
          </DialogHeader>
          {attachRow && attachRow.matter && (
            <EventAttachments
              matterId={attachRow.matter.id}
              eventId={attachRow.id}
              attachments={attachmentsByEvent[attachRow.id] ?? []}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
