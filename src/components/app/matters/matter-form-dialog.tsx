'use client'

import { useEffect, useTransition } from 'react'
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
import {
  matterFormSchema,
  emptyMatterForm,
  MATTER_STATUSES,
  type MatterFormValues,
} from '@/lib/matters/schema'
import { createMatterRecord, updateMatterRecord } from '@/lib/matters/actions'

export type ClientOption = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: ClientOption[]
  matter?: { id: string } & MatterFormValues
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

export function MatterFormDialog({ open, onOpenChange, clients, matter }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
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
    if (open) reset(matter ?? emptyMatterForm())
  }, [open, matter, reset])

  const onSubmit = (values: MatterFormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateMatterRecord(matter!.id, values)
        : await createMatterRecord(values)
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
  const status = watch('status')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-brand-navy">
            {isEdit ? 'Edit matter' : 'Open a matter'}
          </DialogTitle>
          <DialogDescription>
            A case file. Criminal-practice fields are optional — fill what
            applies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client" htmlFor="client_id" error={errors.client_id?.message}>
              <Select
                value={clientId}
                onValueChange={(v) => setValue('client_id', v ?? '')}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="File ref (TJC)" htmlFor="file_ref" error={errors.file_ref?.message}>
              <Input id="file_ref" placeholder="TJC/CRM/2025/014" {...register('file_ref')} />
            </Field>
          </div>

          <Field label="Title" htmlFor="title" error={errors.title?.message}>
            <Input id="title" placeholder="PP v. Ahmad bin Hassan" {...register('title')} />
          </Field>

          <Field label="Case details" htmlFor="description">
            <Textarea id="description" rows={2} placeholder="Nature of the matter, background…" {...register('description')} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status" htmlFor="status">
              <Select
                value={status}
                onValueChange={(v) =>
                  setValue('status', v as MatterFormValues['status'])
                }
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

            <Field label="Next hearing" htmlFor="next_hearing_at">
              <Input id="next_hearing_at" type="datetime-local" {...register('next_hearing_at')} />
            </Field>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-brand-gold">
              Criminal details
            </p>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Court" htmlFor="court">
                  <Input id="court" {...register('court')} />
                </Field>
                <Field label="Accused" htmlFor="accused">
                  <Input id="accused" {...register('accused')} />
                </Field>
                <Field label="Committal case no." htmlFor="case_no_committal">
                  <Input id="case_no_committal" {...register('case_no_committal')} />
                </Field>
                <Field label="Trial case no." htmlFor="case_no_trial">
                  <Input id="case_no_trial" {...register('case_no_trial')} />
                </Field>
                <Field label="Prosecutor / DPP" htmlFor="prosecutor_dpp">
                  <Input id="prosecutor_dpp" {...register('prosecutor_dpp')} />
                </Field>
                <Field label="Opposing counsel" htmlFor="opposing_counsel">
                  <Input id="opposing_counsel" {...register('opposing_counsel')} />
                </Field>
              </div>
              <Field label="Charge(s)" htmlFor="charges">
                <Textarea id="charges" rows={2} {...register('charges')} />
              </Field>
            </div>
          </div>

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
