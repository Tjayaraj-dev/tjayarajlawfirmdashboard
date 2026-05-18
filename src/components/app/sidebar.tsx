'use client'

import { useState } from 'react'
import { signOutAction } from '@/lib/auth/actions'
import type { DemoSession } from '@/lib/auth/demo'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  CalendarDays,
  Shield,
  Settings,
  Tag,
  FolderTree,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { SidebarNavItem, type NavItem } from './sidebar-nav-item'

const WORKSPACE_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/matters', label: 'Matters', icon: FolderOpen },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
]

const ADMIN_ITEMS: NavItem[] = [
  { href: '/users', label: 'Users', icon: UserCog },
  { href: '/case-types', label: 'Case Types', icon: Tag },
  { href: '/document-categories', label: 'Document Categories', icon: FolderTree },
  { href: '/audit-log', label: 'Audit Log', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({
  session,
  isDemoMode,
}: {
  session: DemoSession | null
  isDemoMode: boolean
}) {
  const initials = session?.name
    ? session.name
        .split(' ')
        .filter((p) => p.length > 0)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : '—'

  return (
    <div className="flex h-full flex-col bg-brand-navy text-white">
      <div className="flex items-center gap-3 px-6 pt-7 pb-8">
        <span className="inline-flex size-9 items-center justify-center rounded-md border border-brand-gold/40 bg-brand-gold/10 font-display text-sm font-medium text-brand-gold">
          TJ
        </span>
        <div className="leading-tight">
          <p className="font-display text-[13px] font-medium tracking-[0.18em] text-white">
            T. JAYARAJ &amp; CO.
          </p>
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">
            Command Centre
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pb-6">
        <SidebarSection title="Workspace">
          {WORKSPACE_ITEMS.map((item) => (
            <SidebarNavItem key={item.href} item={item} />
          ))}
        </SidebarSection>

        {session?.role === 'admin' && (
          <SidebarSection title="Admin" className="mt-2">
            {ADMIN_ITEMS.map((item) => (
              <SidebarNavItem key={item.href} item={item} />
            ))}
          </SidebarSection>
        )}
      </nav>

      <div className="border-t border-white/[0.06] px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-display text-xs text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm text-white">
              {session?.name ?? 'Signed in'}
            </p>
            <div className="flex items-center gap-1.5">
              {session?.role && (
                <span className="text-[9px] uppercase tracking-[0.3em] text-brand-gold/85">
                  {session.role}
                </span>
              )}
              {isDemoMode && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                    Demo
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <form action={signOutAction} className="mt-4">
          <button
            type="submit"
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/45 transition-colors hover:text-brand-gold"
          >
            <LogOut className="size-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.5} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

function SidebarSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="px-6 pt-4 pb-2 text-[9px] font-semibold uppercase tracking-[0.35em] text-white/30">
        {title}
      </p>
      <div className="space-y-px">{children}</div>
    </div>
  )
}

export function Sidebar({
  session,
  isDemoMode,
}: {
  session: DemoSession | null
  isDemoMode: boolean
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r border-white/[0.05] lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <SidebarContent session={session} isDemoMode={isDemoMode} />
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-brand-navy/10 bg-white px-4 py-3 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="inline-flex size-9 items-center justify-center rounded-md border border-brand-navy/10 text-brand-navy"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-0 bg-brand-navy p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Command centre navigation
            </SheetDescription>
            <div className="absolute right-3 top-3 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="inline-flex size-7 items-center justify-center rounded-md text-white/60 hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarContent session={session} isDemoMode={isDemoMode} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-md border border-brand-gold/40 bg-brand-gold/10 font-display text-[11px] text-brand-gold">
            TJ
          </span>
          <span className="font-display text-xs font-medium tracking-[0.18em] text-brand-navy">
            T. JAYARAJ
          </span>
        </div>

        <div className="w-9" aria-hidden />
      </div>
    </>
  )
}
