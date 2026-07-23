'use client'

import type { Academia, DateRange, Period } from '@/lib/dashboard/types'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
  { value: '90dias', label: '90 dias' },
  { value: '1ano', label: '1 ano' },
  { value: 'personalizado', label: 'Escolher datas' },
]

export function FilterBar({
  academias,
  academiaId,
  onAcademiaChange,
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: {
  academias: Academia[]
  academiaId: string | null
  onAcademiaChange: (id: string | null) => void
  period: Period
  onPeriodChange: (period: Period) => void
  customRange: DateRange | null
  onCustomRangeChange: (range: DateRange) => void
}) {
  // Coordenador/visualizador só têm 1 academia visível (RLS já cuida disso) —
  // nesse caso não faz sentido mostrar "Todas" nem um seletor (não há o que trocar).
  const showAcademiaPicker = academias.length > 1

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {academias.length === 1 ? (
          <p className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300">
            {academias[0].nome}
          </p>
        ) : showAcademiaPicker ? (
          // Select em vez de pills: com muitas academias, uma linha de pills quebra
          // em várias linhas e fica poluída — um dropdown escala pra qualquer
          // quantidade sem crescer visualmente.
          <select
            value={academiaId ?? ''}
            onChange={(e) => onAcademiaChange(e.target.value || null)}
            aria-label="Filtrar por academia"
            className="select w-full sm:w-64"
          >
            <option value="">Todas as academias</option>
            {academias.map((academia) => (
              <option key={academia.id} value={academia.id}>
                {academia.nome}
              </option>
            ))}
          </select>
        ) : null}

        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              aria-pressed={period === p.value}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                period === p.value
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === 'personalizado' && (
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            De
            <input
              type="date"
              value={customRange?.from ?? ''}
              max={customRange?.to || undefined}
              onChange={(e) => onCustomRangeChange({ from: e.target.value, to: customRange?.to ?? '' })}
              className="input h-9 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Até
            <input
              type="date"
              value={customRange?.to ?? ''}
              min={customRange?.from || undefined}
              onChange={(e) => onCustomRangeChange({ from: customRange?.from ?? '', to: e.target.value })}
              className="input h-9 py-1"
            />
          </label>
        </div>
      )}
    </div>
  )
}
