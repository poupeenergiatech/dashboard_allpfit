'use client'

import { FilterBar } from '@/components/dashboard/filter-bar'
import { FunnelDailyHistoryTable } from '@/components/dashboard/funnel-daily-history-table'
import { FunnelGrid } from '@/components/dashboard/funnel-grid'
import { FunnelStagesChart } from '@/components/dashboard/funnel-stages-chart'
import { FunnelTrendChart } from '@/components/dashboard/funnel-trend-chart'
import { LiveIndicator } from '@/components/dashboard/live-indicator'
import { useAcademiaFilter } from '@/lib/dashboard/use-academia-filter'
import { MOCK_ACADEMIAS, MOCK_FUNNEL_COUNTS } from '@/lib/preview/mock-data'

export default function PreviewFunnelPage() {
  const { academiaId, setAcademiaId, period, setPeriod, customRange, setCustomRange } = useAcademiaFilter(null)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Funil de conversão</h2>
          <p className="page-subtitle">Do QR code na academia até a assinatura do contrato.</p>
        </div>
        <LiveIndicator lastUpdatedAt={new Date()} />
      </div>

      <FilterBar
        academias={MOCK_ACADEMIAS}
        academiaId={academiaId}
        onAcademiaChange={setAcademiaId}
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      <FunnelGrid counts={MOCK_FUNNEL_COUNTS} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelStagesChart counts={MOCK_FUNNEL_COUNTS} />
        <FunnelTrendChart series={MOCK_FUNNEL_COUNTS.series} />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Histórico diário</h3>
        <FunnelDailyHistoryTable series={MOCK_FUNNEL_COUNTS.series} />
      </div>
    </div>
  )
}
