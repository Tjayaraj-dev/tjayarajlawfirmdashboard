import { cookies } from 'next/headers'
import type { Role } from './roles'

export type DemoUser = {
  id: string
  email: string
  password: string
  name: string
  firstName: string
  role: Role
}

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: 'demo-admin',
    email: 'admin@jayarajco.com',
    password: 'demo1234',
    name: 'T. Jayaraj',
    firstName: 'Jayaraj',
    role: 'admin',
  },
  {
    id: 'demo-staff',
    email: 'staff@jayarajco.com',
    password: 'demo1234',
    name: 'Priya Kumar',
    firstName: 'Priya',
    role: 'staff',
  },
] as const

export type DemoSession = Pick<DemoUser, 'id' | 'email' | 'name' | 'firstName' | 'role'>

export const DEMO_COOKIE = 'tjlaw_demo_session'
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7

export function isDemoModeEnabled(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function findDemoUser(email: string, password: string): DemoUser | null {
  const normalized = email.trim().toLowerCase()
  return (
    DEMO_USERS.find(
      (u) => u.email === normalized && u.password === password
    ) ?? null
  )
}

export async function setDemoSession(user: DemoUser): Promise<void> {
  const cookieStore = await cookies()
  const session: DemoSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    role: user.role,
  }
  cookieStore.set(DEMO_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_SECONDS,
  })
}

export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(DEMO_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as DemoSession
  } catch {
    return null
  }
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)
}
