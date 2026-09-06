export type Urgency = 'overdue' | 'critical' | 'soon' | 'normal'

// Boundaries: 0-3 days out = critical, 4-7 = soon, 8+ = normal, negative = overdue.
export function urgencyOf(dateStr: string, todayStr: string): Urgency {
  const diffDays = Math.round(
    (new Date(`${dateStr}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime()) /
      86400000
  )
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'critical'
  if (diffDays <= 7) return 'soon'
  return 'normal'
}

export const URGENCY_RING: Record<Urgency, string> = {
  overdue: 'border-l-4 border-l-red-700 bg-red-50/70',
  critical: 'border-l-4 border-l-red-500',
  soon: 'border-l-4 border-l-amber-500',
  normal: 'border-l-4 border-l-transparent',
}
