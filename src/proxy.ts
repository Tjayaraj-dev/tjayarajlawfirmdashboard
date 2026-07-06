import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/session'
import { DEMO_COOKIE } from '@/lib/auth/demo'

const DEMO_PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/auth']

export async function proxy(request: NextRequest) {
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!hasSupabase) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in production'
      )
    }
    return demoGate(request)
  }

  return await updateSession(request)
}

function demoGate(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = DEMO_PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const hasDemoSession = !!request.cookies.get(DEMO_COOKIE)?.value

  if (!hasDemoSession && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (hasDemoSession && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
