'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Stage = 'loading' | 'none' | 'enrolling' | 'active'

export function MfaCard({ required }: { required: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('loading')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const verified = data?.totp?.find((f) => f.status === 'verified')
    if (verified) {
      setFactorId(verified.id)
      setStage('active')
    } else {
      setStage('none')
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startEnroll = async () => {
    setBusy(true)
    // Clear any stale unverified factor so re-enrolment is clean.
    const { data: list } = await supabase.auth.mfa.listFactors()
    for (const f of list?.all ?? []) {
      if (f.factor_type === 'totp' && f.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id })
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setBusy(false)
    if (error || !data) {
      toast.error(error?.message ?? 'Could not start enrollment')
      return
    }
    setFactorId(data.id)
    setQr(data.totp.qr_code)
    setSecret(data.totp.secret)
    setStage('enrolling')
  }

  const verify = async () => {
    if (!factorId) return
    setBusy(true)
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId })
    if (cErr || !challenge) {
      setBusy(false)
      toast.error(cErr?.message ?? 'Challenge failed')
      return
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    })
    setBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Two-factor authentication enabled')
    setCode('')
    setStage('active')
    router.refresh()
  }

  const disable = async () => {
    if (!factorId) return
    if (!confirm('Disable two-factor authentication for this account?')) return
    setBusy(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    setBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Two-factor disabled')
    setFactorId(null)
    setStage('none')
    router.refresh()
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-start gap-3">
        {stage === 'active' ? (
          <ShieldCheck className="mt-0.5 size-5 text-emerald-600" />
        ) : (
          <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
        )}
        <div className="flex-1">
          <h3 className="font-display text-lg font-medium text-brand-navy">
            Two-factor authentication
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {stage === 'active'
              ? 'Active. A 6-digit code from your authenticator is required at sign-in.'
              : required
                ? 'Required for admin accounts. Protects the client vault if a password is compromised.'
                : 'Recommended. Adds an authenticator code on top of your password.'}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {stage === 'loading' && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}

        {stage === 'none' && (
          <Button onClick={startEnroll} disabled={busy}>
            {busy ? 'Starting…' : 'Enable two-factor'}
          </Button>
        )}

        {stage === 'enrolling' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan with Google Authenticator, Authy or 1Password, then enter the code.
            </p>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="TOTP QR code" className="size-44 rounded border bg-white p-2" />
            )}
            {secret && (
              <p className="text-xs text-muted-foreground">
                Or enter this key manually: <span className="font-mono text-brand-navy">{secret}</span>
              </p>
            )}
            <div className="flex items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="mfa_code">6-digit code</Label>
                <Input
                  id="mfa_code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-32 font-mono tracking-widest"
                />
              </div>
              <Button onClick={verify} disabled={busy || code.length < 6}>
                {busy ? 'Verifying…' : 'Verify & enable'}
              </Button>
            </div>
          </div>
        )}

        {stage === 'active' && (
          <Button variant="outline" onClick={disable} disabled={busy} className="text-destructive">
            Disable two-factor
          </Button>
        )}
      </div>
    </div>
  )
}
