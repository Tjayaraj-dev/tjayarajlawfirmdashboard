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
  clientFormSchema,
  emptyClientForm,
  type ClientFormValues,
} from '@/lib/clients/schema'
import { createClientRecord, updateClientRecord } from '@/lib/clients/actions'

export type CaseTypeOption = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseTypes: CaseTypeOption[]
  client?: { id: string } & ClientFormValues
}

function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function ClientFormDialog({ open, onOpenChange, caseTypes, client }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isEdit = !!client

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyClientForm,
  })

  useEffect(() => {
    if (open) reset(client ? { ...emptyClientForm, ...client } : emptyClientForm)
  }, [open, client, reset])

  const onSubmit = (values: ClientFormValues) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateClientRecord(client!.id, values)
        : await createClientRecord(values)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? 'Client updated' : 'Client created')
      onOpenChange(false)
      router.refresh()
    })
  }

  const type = watch('type')
  const caseTypeId = watch('case_type_id')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-brand-navy">
            {isEdit ? 'Edit client' : 'New client'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this client record.'
              : 'Add an individual or corporate client to the vault.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="name" autoFocus {...register('name')} />
            </Field>

            <Field label="Reference no." htmlFor="reference_no">
              <Input id="reference_no" placeholder="Old / existing file no." {...register('reference_no')} />
            </Field>

            <Field label="Type" htmlFor="type">
              <Select
                value={type}
                onValueChange={(v) => setValue('type', (v ?? 'individual') as ClientFormValues['type'])}
                items={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'corporate', label: 'Corporate' },
                ]}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={type === 'corporate' ? 'Company / SSM no.' : 'NRIC'} htmlFor="ic_or_company_no">
              <Input id="ic_or_company_no" {...register('ic_or_company_no')} />
            </Field>

            <Field label="Phone" htmlFor="phone">
              <Input id="phone" placeholder="012-3456789" {...register('phone')} />
            </Field>

            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
            </Field>

            <Field label="Address" htmlFor="address" className="sm:col-span-2">
              <Textarea id="address" rows={2} {...register('address')} />
            </Field>
          </div>

          {!isEdit && (
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-brand-gold">
                Open a case file
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Optional — fill this to open the client’s first matter now. Leave
                blank to add cases later.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Case file ref" htmlFor="case_file_ref" error={errors.case_file_ref?.message}>
                  <Input id="case_file_ref" placeholder="TJC/CRM/2026/001" {...register('case_file_ref')} />
                </Field>
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
                <Field label="Case details" htmlFor="case_details" className="sm:col-span-2">
                  <Textarea id="case_details" rows={3} placeholder="Nature of the matter, charges, background…" {...register('case_details')} />
                </Field>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
