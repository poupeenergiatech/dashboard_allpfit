import { AnimatedNumber } from './animated-number'

export type FunnelAccent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'

const ACCENT_STYLES: Record<FunnelAccent, { icon: string; ring: string }> = {
  blue: { icon: 'bg-brand-50 text-brand-600', ring: 'group-hover:ring-brand-100' },
  violet: { icon: 'bg-violet-50 text-violet-600', ring: 'group-hover:ring-violet-100' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', ring: 'group-hover:ring-emerald-100' },
  amber: { icon: 'bg-amber-50 text-amber-600', ring: 'group-hover:ring-amber-100' },
  rose: { icon: 'bg-rose-50 text-rose-600', ring: 'group-hover:ring-rose-100' },
}

export function FunnelCard({
  label,
  value,
  conversionRate,
  icon,
  accent = 'blue',
}: {
  label: string
  value: number
  conversionRate?: number | null
  icon: React.ReactNode
  accent?: FunnelAccent
}) {
  const styles = ACCENT_STYLES[accent]

  return (
    <div className={`card-interactive group p-5 ring-1 ring-transparent transition ${styles.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
        <AnimatedNumber value={value} />
      </p>
      {conversionRate != null && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400">
          {conversionRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da etapa anterior
        </p>
      )}
    </div>
  )
}
