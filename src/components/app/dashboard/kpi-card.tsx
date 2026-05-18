import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Sparkline } from './sparkline'
import type { Kpi } from '@/lib/mock/data'

export function KpiCard({ kpi, accent }: { kpi: Kpi; accent?: 'gold' | 'navy' }) {
  const positive = kpi.trend > 0
  const negative = kpi.trend < 0
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus
  const trendColor = positive
    ? 'text-brand-gold'
    : negative
      ? 'text-oxblood/80'
      : 'text-muted-foreground'

  const sparklineColor =
    accent === 'gold' ? 'var(--brand-gold)' : 'var(--brand-navy)'

  return (
    <div className="group relative flex flex-col justify-between rounded-lg border border-brand-navy/10 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,50,0.04)] transition-all hover:shadow-[0_8px_24px_-12px_rgba(15,23,50,0.12)]">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {kpi.label}
      </p>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="font-display text-5xl font-light leading-none tracking-tight text-brand-navy">
          {kpi.value}
        </p>
        <div
          className={`flex items-center gap-0.5 text-xs ${trendColor}`}
          title={kpi.trendLabel}
        >
          <Icon className="size-3.5" strokeWidth={2} />
          <span className="tabular-nums font-medium">
            {Math.abs(kpi.trend)}
          </span>
        </div>
      </div>

      <p className="mt-1 text-[10px] italic text-muted-foreground">
        {kpi.trendLabel}
      </p>

      <div className="mt-4 h-7 w-full" style={{ color: sparklineColor }}>
        <Sparkline data={kpi.sparkline} className="size-full opacity-80" />
      </div>
    </div>
  )
}
