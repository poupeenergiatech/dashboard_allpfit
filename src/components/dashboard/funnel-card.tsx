import { AnimatedNumber } from './animated-number'

export type FunnelAccent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'accent'

// "accent" usa o laranja da marca (ver tailwind.config.ts) — reservado pra
// métricas de "resultado final" do funil (conversões, academia líder), os únicos
// lugares do produto fora do login onde a segunda cor do logo aparecia.
const ACCENT_STYLES: Record<FunnelAccent, { icon: string; ring: string }> = {
  blue: {
    icon: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    ring: 'group-hover:ring-brand-100 dark:group-hover:ring-brand-500/20',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    ring: 'group-hover:ring-violet-100 dark:group-hover:ring-violet-500/20',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    ring: 'group-hover:ring-emerald-100 dark:group-hover:ring-emerald-500/20',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    ring: 'group-hover:ring-amber-100 dark:group-hover:ring-amber-500/20',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    ring: 'group-hover:ring-rose-100 dark:group-hover:ring-rose-500/20',
  },
  accent: {
    icon: 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400',
    ring: 'group-hover:ring-accent-100 dark:group-hover:ring-accent-500/20',
  },
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
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        <AnimatedNumber value={value} />
      </p>
      {conversionRate != null && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
          {conversionRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da etapa anterior
        </p>
      )}
    </div>
  )
}
