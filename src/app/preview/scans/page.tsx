import { ScansDailyTable } from '@/components/dashboard/scans-daily-table'
import { ScansRankingChart } from '@/components/dashboard/scans-ranking-chart'
import { ScansRankingTable } from '@/components/dashboard/scans-ranking-table'
import { ScansSummaryCards } from '@/components/dashboard/scans-summary-cards'
import { ScansTrendChart } from '@/components/dashboard/scans-trend-chart'
import { MOCK_SCANS_SUMMARY } from '@/lib/preview/mock-data'

export default function PreviewScansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Scans QR</h2>
        <p className="page-subtitle">Detalhe completo dos scans lançados via RPA, por dia e por academia.</p>
      </div>

      <ScansSummaryCards summary={MOCK_SCANS_SUMMARY} />

      <ScansTrendChart series={MOCK_SCANS_SUMMARY.series} />

      <ScansRankingChart rows={MOCK_SCANS_SUMMARY.porAcademia} />
      <ScansRankingTable rows={MOCK_SCANS_SUMMARY.porAcademia} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Histórico diário</h3>
        <ScansDailyTable series={MOCK_SCANS_SUMMARY.series} />
      </div>
    </div>
  )
}
