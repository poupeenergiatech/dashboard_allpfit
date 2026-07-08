'use client'

import type { Academia, Period } from '@/lib/dashboard/types'

const PERIODS: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
]

export function FilterBar({
  academias,
  academiaId,
  onAcademiaChange,
  period,
  onPeriodChange,
}: {
  academias: Academia[]
  academiaId: string | null
  onAcademiaChange: (id: string | null) => void
  period: Period
  onPeriodChange: (period: Period) => void
}) {
  // Coordenador/visualizador só têm 1 academia visível (RLS já cuida disso) —
  // nesse caso não faz sentido mostrar a aba "Todas".
  const showAllTab = academias.length > 1

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {showAllTab && (
          <FilterTab active={academiaId === null} onClick={() => onAcademiaChange(null)}>
            Todas
          </FilterTab>
        )}
        {academias.map((academia) => (
          <FilterTab
            key={academia.id}
            active={academiaId === academia.id}
            onClick={() => onAcademiaChange(academia.id)}
          >
            {academia.nome}
          </FilterTab>
        ))}
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPeriodChange(p.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              period === p.value
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}
