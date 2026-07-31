import { AcademiaPerformanceChart } from '@/components/dashboard/academia-performance-chart'
import { GestoresPanelSummaryCards } from '@/components/dashboard/gestores-panel-summary-cards'
import { GestoresPodium } from '@/components/dashboard/gestores-podium'
import { GestoresRankingTable } from '@/components/dashboard/gestores-ranking-table'
import { GestoresScansChart } from '@/components/dashboard/gestores-scans-chart'
import { MOCK_GESTORES_PANEL } from '@/lib/preview/mock-data'

export default function PreviewGestoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">
          Resumo comparativo entre as unidades — performance, scans, conversões e treinamento, tudo num só lugar
          pra facilitar a competição.
        </p>
      </div>

      <GestoresPanelSummaryCards data={MOCK_GESTORES_PANEL} />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <GestoresPodium rows={MOCK_GESTORES_PANEL.rows} metricKey="totalContatos" />
        <GestoresPodium rows={MOCK_GESTORES_PANEL.rows} metricKey="totalConversoes" />
        <GestoresPodium rows={MOCK_GESTORES_PANEL.rows} metricKey="totalScansPeriodo" />
      </div>
      <GestoresRankingTable rows={MOCK_GESTORES_PANEL.rows} />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <GestoresScansChart rows={MOCK_GESTORES_PANEL.rows} />
        <AcademiaPerformanceChart rows={MOCK_GESTORES_PANEL.rows} />
      </div>
    </div>
  )
}
