'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { loginAction, type LoginState } from '@/lib/auth/actions'

const initialState: LoginState = { error: null }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

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
          className="peer w-full border-0 border-b border-white/20 bg-transparent pb-2.5 text-base text-white placeholder:text-white/25 transition-all duration-300 focus:border-brand-gold focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-[10px] uppercase tracking-[0.3em] text-white/60"
          >
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-brand-gold"
          >
            Forgot
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="peer w-full border-0 border-b border-white/20 bg-transparent pb-2.5 text-base text-white transition-all duration-300 focus:border-brand-gold focus:outline-none disabled:opacity-50"
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
        className="group relative mt-8 w-full overflow-hidden border border-brand-gold/40 bg-transparent px-6 py-3.5 text-[11px] uppercase tracking-[0.35em] text-brand-gold transition-all duration-500 hover:border-brand-gold hover:bg-brand-gold hover:text-brand-gold-foreground hover:tracking-[0.4em] disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-brand-gold/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
        />
        <span className="relative flex items-center justify-center gap-3">
          {pending && <Loader2 className="size-3 animate-spin" />}
          {pending ? 'Entering' : 'Enter'}
        </span>
      </button>
    </form>
  )
}
