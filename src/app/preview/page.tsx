'use client'

import { useState } from 'react'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { FunnelDailyHistoryTable } from '@/components/dashboard/funnel-daily-history-table'
import { FunnelGrid } from '@/components/dashboard/funnel-grid'
import { FunnelStagesChart } from '@/components/dashboard/funnel-stages-chart'
import { FunnelTrendChart } from '@/components/dashboard/funnel-trend-chart'
import { LiveIndicator } from '@/components/dashboard/live-indicator'
import { ManualDataSection } from '@/components/dashboard/manual-data-section'
import { Icon } from '@/components/ui/icons'
import { useAcademiaFilter } from '@/lib/dashboard/use-academia-filter'
import { MOCK_ACADEMIAS, MOCK_FUNNEL_COUNTS, MOCK_MANUAL_DATA_HISTORY } from '@/lib/preview/mock-data'
import { mockSave } from '@/lib/preview/mock-actions'

export default function PreviewFunnelPage() {
  const { academiaId, setAcademiaId, period, setPeriod, customRange, setCustomRange } = useAcademiaFilter(null)
  const [showManualData, setShowManualData] = useState(false)

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

      <FunnelStagesChart counts={MOCK_FUNNEL_COUNTS} />
      <FunnelTrendChart series={MOCK_FUNNEL_COUNTS.series} />

      <FunnelGrid counts={MOCK_FUNNEL_COUNTS} isSuperAdmin />

      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Histórico diário</h3>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Um resumo por dia do período selecionado acima — quantos scans, contatos, conversões e reprovados cada
          dia teve, somando todas as academias no filtro.
        </p>
        <FunnelDailyHistoryTable series={MOCK_FUNNEL_COUNTS.series} />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowManualData((v) => !v)}
          aria-expanded={showManualData}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dados manuais</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lançamentos feitos à mão (scans, ajustes e conversões fora da Ane) — a maioria dos números do funil
              já é automática, não precisa abrir isso pra acompanhar o dia a dia.
            </p>
          </div>
          <Icon
            name="chevron-down"
            strokeWidth={2.5}
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 dark:text-slate-500 ${showManualData ? 'rotate-180' : ''}`}
          />
        </button>
        {showManualData && (
          <div className="mt-3">
            <ManualDataSection
              academias={MOCK_ACADEMIAS}
              fixedAcademiaId={null}
              history={MOCK_MANUAL_DATA_HISTORY}
              onSave={mockSave}
            />
          </div>
        )}
      </div>
    </div>
  )
}
