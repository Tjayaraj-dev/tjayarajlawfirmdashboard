'use client'

import { signOutAction } from '@/lib/auth/actions'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-brand-navy"
      >
        <LogOut className="size-3.5" />
        Sign out
      </button>
    </form>
  )
}
