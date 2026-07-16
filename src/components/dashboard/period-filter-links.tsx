import Link from 'next/link'
import type { DateRange } from '@/lib/dashboard/types'
import type { PerformancePeriod } from '@/lib/dashboard/fetch-academia-performance'

const PERIODS: { value: PerformancePeriod; label: string }[] = [
  { value: 'todos', label: 'Todo período' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
  { value: '90dias', label: '90 dias' },
  { value: '1ano', label: '1 ano' },
  { value: 'personalizado', label: 'Personalizado' },
]

// Igual à FilterBar de / (mesmos rótulos/pills), só que via navegação simples — essa
// página não faz polling nem precisa de estado no client, então um Link/form comum já
// resolve, sem puxar toda a máquina de client-fetch-hook só pra isso.
export function PeriodFilterLinks({
  basePath,
  period,
  customRange,
  extraParams = {},
}: {
  basePath: string
  period: PerformancePeriod
  customRange: DateRange | null
  extraParams?: Record<string, string>
}) {
  function hrefFor(value: PerformancePeriod): string {
    const params = new URLSearchParams(extraParams)
    params.set('period', value)
    if (value === 'personalizado' && customRange) {
      params.set('from', customRange.from)
      params.set('to', customRange.to)
    }
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap gap-1 self-start rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={hrefFor(p.value)}
            aria-current={period === p.value ? 'page' : undefined}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
              period === p.value ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {period === 'personalizado' && (
        <form
          action={basePath}
          method="get"
          className="flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3"
        >
          {Object.entries(extraParams).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <input type="hidden" name="period" value="personalizado" />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            De
            <input
              type="date"
              name="from"
              defaultValue={customRange?.from ?? ''}
              max={customRange?.to || undefined}
              className="input h-9 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Até
            <input
              type="date"
              name="to"
              defaultValue={customRange?.to ?? ''}
              min={customRange?.from || undefined}
              className="input h-9 py-1"
            />
          </label>
          <button type="submit" className="btn-secondary h-9">
            Aplicar
          </button>
        </form>
      )}
    </div>
  )
}
