'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Combobox } from '@/components/ui/combobox'
import {
  matterFormSchema,
  emptyMatterForm,
  MATTER_STATUSES,
  type MatterFormValues,
} from '@/lib/matters/schema'
import {
  APPOINTMENT_TYPES,
  caseTypeFields,
  type MatterFieldDef,
} from '@/lib/matters/case-type-config'
import { createMatterRecord, updateMatterRecord } from '@/lib/matters/actions'

export type ClientOption = { id: string; name: string }
export type CaseTypeOption = { id: string; name: string; slug: string }
export type CourtOption = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: ClientOption[]
  caseTypes: CaseTypeOption[]
  courts: CourtOption[]
  matter?: { id: string; values: MatterFormValues; customFields: Record<string, string> }
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function MatterFormDialog({
  open,
  onOpenChange,
  clients,
  caseTypes,
  courts,
  matter,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [customFields, setCustomFields] = useState<Record<string, string>>({})
  const isEdit = !!matter

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MatterFormValues>({
    resolver: zodResolver(matterFormSchema),
    defaultValues: emptyMatterForm(),
  })

  useEffect(() => {
    if (open) {
      reset(matter?.values ?? emptyMatterForm())
      setCustomFields(matter?.customFields ?? {})
    }
  }, [open, matter, reset])

  const onSubmit = (values: MatterFormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateMatterRecord(matter!.id, values, customFields)
        : await createMatterRecord(values, customFields)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? 'Matter updated' : 'Matter opened')
      onOpenChange(false)
      router.refresh()
    })
  }

  const clientId = watch('client_id')
  const caseTypeId = watch('case_type_id')
  const appointmentType = watch('appointment_type')
  const court = watch('court')
  const status = watch('status')

  const slug = caseTypes.find((c) => c.id === caseTypeId)?.slug
  const typeFields = caseTypeFields(slug)
  const setCf = (key: string, v: string) =>
    setCustomFields((prev) => ({ ...prev, [key]: v }))

  const renderField = (f: MatterFieldDef) => {
    if (f.input === 'court') {
      return (
        <Field key={f.key} label={f.label}>
          <Select value={customFields[f.key] || null} onValueChange={(v) => setCf(f.key, v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select a court" />
            </SelectTrigger>
            <SelectContent>
              {courts.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )
    }
    if (f.input === 'textarea') {
      return (
        <Field key={f.key} label={f.label}>
          <Textarea rows={2} value={customFields[f.key] ?? ''} onChange={(e) => setCf(f.key, e.target.value)} />
        </Field>
      )
    }
    return (
      <Field key={f.key} label={f.label}>
        <Input value={customFields[f.key] ?? ''} onChange={(e) => setCf(f.key, e.target.value)} />
      </Field>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-brand-navy">
            {isEdit ? 'Edit matter' : 'Open a matter'}
          </DialogTitle>
          <DialogDescription>
            A case file. Pick the case type and the form adapts to that cover
            sheet’s fields.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client" htmlFor="client_id" error={errors.client_id?.message}>
              <Combobox
                id="client_id"
                value={clientId}
                onValueChange={(v) => setValue('client_id', v)}
                items={clients.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select a client"
                searchPlaceholder="Search clients…"
                emptyText="No clients found."
              />
            </Field>

            <Field label="File ref (TJC)" htmlFor="file_ref" error={errors.file_ref?.message}>
              <Input id="file_ref" placeholder="TJC/CRM/2025/014" {...register('file_ref')} />
            </Field>
          </div>

          <Field label="Title" htmlFor="title" error={errors.title?.message}>
            <Input id="title" placeholder="PP v. Ahmad bin Hassan" {...register('title')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Case type" htmlFor="case_type_id">
              <Select
                value={caseTypeId || null}
                onValueChange={(v) => setValue('case_type_id', v ?? '')}
                items={caseTypes.map((c) => ({ value: c.id, label: c.name }))}
              >
                <SelectTrigger id="case_type_id">
                  <SelectValue placeholder={caseTypes.length ? 'Select…' : 'Add case types in admin'} />
                </SelectTrigger>
                <SelectContent>
                  {caseTypes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Appointment" htmlFor="appointment_type">
              <Select
                value={appointmentType || null}
                onValueChange={(v) => setValue('appointment_type', (v ?? '') as MatterFormValues['appointment_type'])}
                items={APPOINTMENT_TYPES.map((a) => ({ value: a.value, label: a.label }))}
              >
                <SelectTrigger id="appointment_type">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Court" htmlFor="court">
              <Select value={court || null} onValueChange={(v) => setValue('court', v ?? '')}>
                <SelectTrigger id="court">
                  <SelectValue placeholder="Select a court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status" htmlFor="status">
              <Select
                value={status}
                onValueChange={(v) => setValue('status', v as MatterFormValues['status'])}
                items={MATTER_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATTER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Opened" htmlFor="opened_at" error={errors.opened_at?.message}>
              <Input id="opened_at" type="date" {...register('opened_at')} />
            </Field>
          </div>

          <Field label="Next hearing" htmlFor="next_hearing_at">
            <Input id="next_hearing_at" type="datetime-local" {...register('next_hearing_at')} />
          </Field>

          {typeFields.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-brand-gold">
                {caseTypes.find((c) => c.id === caseTypeId)?.name} details
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {typeFields.map(renderField)}
              </div>
            </div>
          )}

          <Field label="Notes / description" htmlFor="description">
            <Textarea id="description" rows={2} {...register('description')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Open matter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
