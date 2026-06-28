'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFirmSettings, type FirmSettingsValues } from '@/lib/firm/actions'

export function FirmSettingsForm({ initial }: { initial: FirmSettingsValues }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [v, setV] = useState<FirmSettingsValues>(initial)

  const set = <K extends keyof FirmSettingsValues>(
    k: K,
    val: FirmSettingsValues[K]
  ) => setV((p) => ({ ...p, [k]: val }))

  const save = () => {
    startTransition(async () => {
      const { error } = await updateFirmSettings(v)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Settings saved')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Firm name</Label>
          <Input id="name" value={v.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bar">Bar Council no.</Label>
          <Input id="bar" value={v.bar_council_no} onChange={(e) => set('bar_council_no', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sender">Sender email</Label>
          <Input id="sender" type="email" placeholder="no-reply@jayarajco.com" value={v.sender_email} onChange={(e) => set('sender_email', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="retention">Retention (years)</Label>
          <Input
            id="retention"
            type="number"
            min={1}
            value={v.retention_years}
            onChange={(e) => set('retention_years', Number(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hex">Brand colour</Label>
          <div className="flex items-center gap-2">
            <input
              id="hex"
              type="color"
              value={v.primary_hex || '#1e3a5f'}
              onChange={(e) => set('primary_hex', e.target.value)}
              className="size-9 cursor-pointer rounded border bg-white"
            />
            <Input value={v.primary_hex} onChange={(e) => set('primary_hex', e.target.value)} className="max-w-32 font-mono" />
          </div>
        </div>
      </div>
      <Button onClick={save} disabled={pending}>
        {pending ? 'Saving…' : 'Save settings'}
      </Button>
    </div>
  )
}
