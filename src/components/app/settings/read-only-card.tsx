'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, LockOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setReadOnlyMode } from '@/lib/firm/actions'

export function ReadOnlyCard({ active }: { active: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const toggle = (enable: boolean) => {
    if (
      enable &&
      !confirm(
        'Enable Emergency Read-Only Mode?\n\nAll changes across the system will be blocked for everyone — including admins — until you turn it off. Reads and downloads still work.'
      )
    )
      return
    startTransition(async () => {
      const { error } = await setReadOnlyMode(enable)
      if (error) {
        toast.error(error)
        return
      }
      toast.success(enable ? 'Read-only mode enabled' : 'Read-only mode lifted')
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-start gap-3">
        {active ? (
          <Lock className="mt-0.5 size-5 text-oxblood" />
        ) : (
          <LockOpen className="mt-0.5 size-5 text-emerald-600" />
        )}
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium text-brand-navy">
            Emergency read-only mode
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {active
              ? 'ACTIVE — the system is frozen. No records can be created, edited or deleted by anyone. Reads and downloads continue.'
              : 'Freeze the entire system to read-only in an incident — preserves data exactly as-is while keeping it viewable. Affects everyone, including admins.'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {active ? (
          <Button onClick={() => toggle(false)} disabled={pending}>
            {pending ? 'Working…' : 'Lift read-only mode'}
          </Button>
        ) : (
          <Button variant="outline" className="text-oxblood" onClick={() => toggle(true)} disabled={pending}>
            {pending ? 'Working…' : 'Enable read-only mode'}
          </Button>
        )}
      </div>
    </div>
  )
}
