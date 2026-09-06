'use client'

import { useEffect, useState, useTransition } from 'react'
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
import { scheduleNextHearing } from '@/lib/matters/actions'
import { ClientMatterPicker, type MatterOption } from '@/components/app/matters/client-matter-picker'

// Schedules a matter's next hearing straight from a clicked calendar day —
// deliberately not the full event-log form, which logs a proceeding that
// already happened rather than one that's merely upcoming.
export function QuickScheduleDialog({
  open,
  onOpenChange,
  matters,
  defaultDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matters: MatterOption[]
  defaultDate: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [pickedClient, setPickedClient] = useState('')
  const [pickedMatter, setPickedMatter] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [time, setTime] = useState('09:00')

  useEffect(() => {
    if (open) {
      setPickedClient('')
      setPickedMatter('')
      setDate(defaultDate)
      setTime('09:00')
    }
  }, [open, defaultDate])

  const submit = () => {
    if (!pickedMatter) {
      toast.error('Select a matter first')
      return
    }
    if (!date) {
      toast.error('Pick a date')
      return
    }
    startTransition(async () => {
      const { error } = await scheduleNextHearing(pickedMatter, date, time)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Hearing scheduled')
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light text-brand-navy">
            Schedule a hearing
          </DialogTitle>
          <DialogDescription>
            Sets this matter&apos;s next hearing date. To log what happened at a proceeding,
            use &quot;Log event&quot; instead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <ClientMatterPicker
            matters={matters}
            clientId={pickedClient}
            onClientChange={setPickedClient}
            matterId={pickedMatter}
            onMatterChange={setPickedMatter}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="qs_date">Date</Label>
              <Input id="qs_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qs_time">Time</Label>
              <Input id="qs_time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? 'Saving…' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
