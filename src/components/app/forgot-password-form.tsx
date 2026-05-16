'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from '@/lib/auth/actions'

const initialState: ForgotPasswordState = { error: null, sent: false }

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState
  )

  if (state.sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-px w-12 bg-brand-gold" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold/90">
            Check your inbox
          </p>
          <p className="text-sm leading-relaxed text-white/75">
            If an account exists for that email, we&rsquo;ve sent a secure
            link to restore access. The link is valid for one hour.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-brand-gold transition-colors hover:text-brand-gold/80"
        >
          <span className="h-px w-6 bg-brand-gold" />
          Return to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[10px] uppercase tracking-[0.3em] text-white/60"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="counsel@firm.com"
          className="w-full border-0 border-b border-white/20 bg-transparent pb-2.5 text-base text-white placeholder:text-white/25 transition-all duration-300 focus:border-brand-gold focus:outline-none disabled:opacity-50"
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="border-l-2 border-brand-gold/70 pl-3 text-xs leading-relaxed text-white/80"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group relative mt-6 w-full overflow-hidden border border-brand-gold/40 bg-transparent px-6 py-3.5 text-[11px] uppercase tracking-[0.35em] text-brand-gold transition-all duration-500 hover:border-brand-gold hover:bg-brand-gold hover:text-brand-gold-foreground hover:tracking-[0.4em] disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
        />
        <span className="relative flex items-center justify-center gap-3">
          {pending && <Loader2 className="size-3 animate-spin" />}
          {pending ? 'Sending' : 'Send recovery link'}
        </span>
      </button>

      <div className="pt-2">
        <Link
          href="/login"
          className="text-[10px] uppercase tracking-[0.3em] text-white/40 transition-colors hover:text-brand-gold"
        >
          ← Back to sign in
        </Link>
      </div>
    </form>
  )
}
