'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export function SidebarNavItem({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 px-5 py-2 text-sm transition-colors',
        isActive
          ? 'bg-white/[0.04] text-white'
          : 'text-white/55 hover:bg-white/[0.02] hover:text-white/85'
      )}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand-gold"
        />
      )}
      <Icon
        className={cn(
          'size-[15px] shrink-0 transition-colors',
          isActive ? 'text-brand-gold' : 'text-white/40 group-hover:text-white/70'
        )}
        strokeWidth={1.5}
      />
      <span className="truncate font-medium tracking-wide">{item.label}</span>
    </Link>
  )
}
