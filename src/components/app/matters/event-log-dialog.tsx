'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  EVENT_TYPES,
  EVENT_TYPE_MAP,
  type CaseEventType,
  type FieldDef,
} from '@/lib/case-events/config'
import { createCaseEvent } from '@/lib/case-events/actions'

function nowLocal(): string {
  const dt = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: string
  onChange: (v: string) => void
}) {
  const id = `ev_${field.key}`
  const common = { id, value, onChange: (e: { target: { value: string } }) => onChange(e.target.value) }
  return (
    <div className={cn('space-y-1.5', field.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
      <Label htmlFor={id}>{field.label}</Label>
      {field.input === 'textarea' ? (
        <Textarea rows={2} placeholder={field.placeholder} {...common} />
      ) : (
        <Input
          type={
            field.input === 'datetime'
              ? 'datetime-local'
              : field.input === 'date'
                ? 'date'
                : field.input === 'time'
                  ? 'time'
                  : 'text'
          }
          placeholder={field.placeholder}
          {...common}
        />
      )}
    </div>
  )
}

export type MatterOption = { id: string; file_ref: string; title: string }

export function EventLogDialog({
  open,
  onOpenChange,
  matterId,
  matters,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Fixed when opened from a matter; otherwise pick from `matters` (calendar).
  matterId?: string
  matters?: MatterOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState<CaseEventType>('court_attendance')
  const [values, setValues] = useState<Record<string, string>>({})
  const [pickedMatter, setPickedMatter] = useState('')

  const cfg = EVENT_TYPE_MAP[type]
  const targetMatter = matterId ?? pickedMatter
  const needsPicker = !matterId && !!matters

  // Reset fields when opening or switching type; default the timestamp to now.
  useEffect(() => {
    if (open) {
      setValues({ occurred_at: nowLocal() })
      if (!matterId) setPickedMatter('')
    }
  }, [open, type, matterId])

  const set = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }))

  const submit = () => {
    if (!targetMatter) {
      toast.error('Select a matter first')
      return
    }
    startTransition(async () => {
      const { error } = await createCaseEvent(targetMatter, type, values)
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`${cfg.label} logged`)
      onOpenChange(false)
      router.refresh()
    })
  }

  const fields = useMemo(() => cfg.fields, [cfg])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-brand-navy">
            Log an event
          </DialogTitle>
          <DialogDescription>{cfg.blurb}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {needsPicker && (
            <div className="space-y-1.5">
              <Label htmlFor="ev_matter">Matter</Label>
              <Select value={pickedMatter} onValueChange={(v) => setPickedMatter(v ?? '')}>
                <SelectTrigger id="ev_matter">
                  <SelectValue placeholder="Select a matter" />
                </SelectTrigger>
                <SelectContent>
                  {matters!.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.file_ref} — {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ev_type">Form type</Label>
            <Select value={type} onValueChange={(v) => setType((v ?? 'court_attendance') as CaseEventType)}>
              <SelectTrigger id="ev_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((e) => (
                  <SelectItem key={e.type} value={e.type}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <FieldControl
                key={f.key}
                field={f}
                value={values[f.key] ?? ''}
                onChange={(v) => set(f.key, v)}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? 'Saving…' : 'Log event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
