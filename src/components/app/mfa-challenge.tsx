'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { signOutAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function MfaChallenge() {
  const supabase = createClient()
  const router = useRouter()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === 'verified')
      setFactorId(verified?.id ?? null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white p-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold">
        Two-factor
      </p>
      <h1 className="mt-2 font-display text-2xl font-light text-brand-navy">
        Enter your code
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open your authenticator app and enter the 6-digit code for T. Jayaraj &amp; Company.
      </p>

      <Input
        autoFocus
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="000000"
        className="mt-5 text-center font-mono text-lg tracking-[0.4em]"
      />

      <Button onClick={verify} disabled={busy || code.length < 6} className="mt-4 w-full">
        {busy ? 'Verifying…' : 'Verify'}
      </Button>

      <form action={signOutAction} className="mt-4 text-center">
        <button type="submit" className="text-xs text-muted-foreground hover:text-brand-navy">
          Sign in as a different user
        </button>
      </form>
    </div>
  )
}
