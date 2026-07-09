'use client'

import { FilterBar } from '@/components/dashboard/filter-bar'
import { FunnelGrid } from '@/components/dashboard/funnel-grid'
import { LiveIndicator } from '@/components/dashboard/live-indicator'
import { useAcademiaFilter } from '@/lib/dashboard/use-academia-filter'
import { MOCK_ACADEMIAS, MOCK_FUNNEL_COUNTS } from '@/lib/preview/mock-data'

export default function PreviewFunnelPage() {
  const { academiaId, setAcademiaId, period, setPeriod } = useAcademiaFilter(null)

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
      />

      <FunnelGrid counts={MOCK_FUNNEL_COUNTS} />
    </div>
  )
}
