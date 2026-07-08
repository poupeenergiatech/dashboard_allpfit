import { AnimatedNumber } from './animated-number'

export function FunnelCard({
  label,
  value,
  conversionRate,
}: {
  label: string
  value: number
  conversionRate?: number | null
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        <AnimatedNumber value={value} />
      </p>
      {conversionRate != null && (
        <p className="mt-1 text-xs text-slate-400">
          {conversionRate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da etapa anterior
        </p>
      )}
    </div>
  )
}
