'use client'

import { FilterBar } from './filter-bar'
import { FunnelGrid } from './funnel-grid'
import { LiveIndicator } from './live-indicator'
import { useAcademiaFilter } from '@/lib/dashboard/use-academia-filter'
import { useFunnelData } from '@/lib/dashboard/use-funnel-data'
import type { Academia } from '@/lib/dashboard/types'

export function FunnelDashboard({
  academias,
  initialAcademiaId,
}: {
  academias: Academia[]
  initialAcademiaId: string | null
}) {
  const { academiaId, setAcademiaId, period, setPeriod } = useAcademiaFilter(initialAcademiaId)
  const { counts, loading, error, lastUpdatedAt } = useFunnelData(academiaId, period)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Funil de conversão</h2>
        <LiveIndicator lastUpdatedAt={lastUpdatedAt} />
      </div>

      <FilterBar
        academias={academias}
        academiaId={academiaId}
        onAcademiaChange={setAcademiaId}
        period={period}
        onPeriodChange={setPeriod}
      />

      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {loading && !counts ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        counts && <FunnelGrid counts={counts} />
      )}
    </div>
  )
}
