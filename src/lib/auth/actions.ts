'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  clearDemoSession,
  findDemoUser,
  isDemoModeEnabled,
  setDemoSession,
} from '@/lib/auth/demo'

const loginSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
})

const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address' }),
})

export type LoginState = {
  error: string | null
}

export type ForgotPasswordState = {
  error: string | null
  sent: boolean
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  if (isDemoModeEnabled()) {
    const user = findDemoUser(parsed.data.email, parsed.data.password)
    if (!user) {
      return { error: 'Invalid credentials. Demo accounts only — see the panel below.' }
    }
    await setDemoSession(user)
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: error.message }
  }

  // If the account has a verified TOTP factor, the password only gets them to
  // aal1 — send them to the second-factor challenge before the app.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
    redirect('/mfa')
  }

  redirect('/dashboard')
}

export async function signOutAction(): Promise<void> {
  if (isDemoModeEnabled()) {
    await clearDemoSession()
    redirect('/login')
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid email', sent: false }
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      error: 'Password reset is not yet configured. Set Supabase keys in .env.local to enable email recovery.',
      sent: false,
    }
  }

  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  })

  if (error) {
    return { error: error.message, sent: false }
  }

  return { error: null, sent: true }
}

