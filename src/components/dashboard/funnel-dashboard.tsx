'use client'

import { FilterBar } from './filter-bar'
import { FunnelDailyHistoryTable } from './funnel-daily-history-table'
import { FunnelGrid } from './funnel-grid'
import { FunnelStagesChart } from './funnel-stages-chart'
import { FunnelTrendChart } from './funnel-trend-chart'
import { LiveIndicator } from './live-indicator'
import { ManualDataSection } from './manual-data-section'
import { useAcademiaFilter } from '@/lib/dashboard/use-academia-filter'
import { useFunnelData } from '@/lib/dashboard/use-funnel-data'
import type { Academia } from '@/lib/dashboard/types'
import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'

export function FunnelDashboard({
  academias,
  initialAcademiaId,
  canEditManualData,
  manualDataHistory,
}: {
  academias: Academia[]
  initialAcademiaId: string | null
  canEditManualData: boolean
  manualDataHistory: ManualDataEntry[]
}) {
  const { academiaId, setAcademiaId, period, setPeriod, customRange, setCustomRange } =
    useAcademiaFilter(initialAcademiaId)
  const { counts, loading, error, lastUpdatedAt } = useFunnelData(academiaId, period, customRange)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Funil de conversão</h2>
          <p className="page-subtitle">Do QR code na academia até a assinatura do contrato.</p>
        </div>
        <LiveIndicator lastUpdatedAt={lastUpdatedAt} />
      </div>

      <FilterBar
        academias={academias}
        academiaId={academiaId}
        onAcademiaChange={setAcademiaId}
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {error && (
        <p className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {loading && !counts ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </>
      ) : (
        counts && (
          <>
            <FunnelGrid counts={counts} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FunnelStagesChart counts={counts} />
              <FunnelTrendChart series={counts.series} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Histórico diário</h3>
              {/* key força remontar (e resetar a página) quando o filtro muda — sem
                  isso, o poll de 10s trocaria a prop `series` e a paginação ficaria
                  instável enquanto o usuário navega entre páginas. */}
              <FunnelDailyHistoryTable
                key={`${academiaId ?? 'todas'}-${period}-${customRange?.from ?? ''}-${customRange?.to ?? ''}`}
                series={counts.series}
              />
            </div>
          </>
        )
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Dados manuais</h3>
        <ManualDataSection
          academias={academias}
          fixedAcademiaId={initialAcademiaId}
          history={manualDataHistory}
          editable={canEditManualData}
        />
      </div>
    </div>
  )
}
