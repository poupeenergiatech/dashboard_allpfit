import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { PeriodFilterLinks } from '@/components/dashboard/period-filter-links'
import { ScansDailyTable } from '@/components/dashboard/scans-daily-table'
import { ScansRankingChart } from '@/components/dashboard/scans-ranking-chart'
import { ScansRankingTable } from '@/components/dashboard/scans-ranking-table'
import { ScansSummaryCards } from '@/components/dashboard/scans-summary-cards'
import { ScansTrendChart } from '@/components/dashboard/scans-trend-chart'
import { fetchScansSummary, type ScansPeriod } from '@/lib/dashboard/fetch-scans'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { getCurrentUserProfile } from '@/lib/auth/profile'
import type { DateRange } from '@/lib/dashboard/types'

const VALID_PERIODS: ScansPeriod[] = ['todos', 'hoje', 'ontem', '7dias', '30dias', '90dias', '1ano', 'personalizado']

function defaultCustomRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

// Visão dedicada de scans QR — o card "Scans QR" do funil (/) só mostra o total
// agregado do período escolhido lá; aqui é o detalhe completo: tendência diária,
// ranking por academia e histórico expansível dia a dia, pra qualquer role
// autenticada conferir de onde vem o número (mesmo modelo de leitura livre de
// /performance — só a edição de dados manuais é restrita).
export default async function ScansPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string; academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)

  const period: ScansPeriod = VALID_PERIODS.includes(searchParams.period as ScansPeriod)
    ? (searchParams.period as ScansPeriod)
    : '30dias'
  const customRange: DateRange | null =
    period === 'personalizado'
      ? searchParams.from && searchParams.to
        ? { from: searchParams.from, to: searchParams.to }
        : defaultCustomRange()
      : null
  const requestedAcademiaId = searchParams.academia ?? null

  const [summary, academias] = await Promise.all([
    profile
      ? fetchScansSummary(profile, period, customRange, requestedAcademiaId)
      : Promise.resolve({ totalScans: 0, porAcademia: [], series: [], days: null }),
    fetchActiveAcademias(profile),
  ])

  const periodExtraParams: Record<string, string> = requestedAcademiaId ? { academia: requestedAcademiaId } : {}
  const academiaExtraParams: Record<string, string> = { period }
  if (customRange) {
    academiaExtraParams.from = customRange.from
    academiaExtraParams.to = customRange.to
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Scans QR</h2>
        <p className="page-subtitle">Detalhe completo dos scans lançados via RPA, por dia e por academia.</p>
      </div>

      <PeriodFilterLinks
        basePath="/scans"
        period={period}
        customRange={customRange}
        extraParams={periodExtraParams}
      />
      <AcademiaFilterLinks
        basePath="/scans"
        academias={academias}
        academiaId={requestedAcademiaId}
        extraParams={academiaExtraParams}
      />

      <ScansSummaryCards summary={summary} />

      <ScansTrendChart series={summary.series} />

      <ScansRankingChart rows={summary.porAcademia} />
      <ScansRankingTable rows={summary.porAcademia} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Histórico diário</h3>
        <ScansDailyTable series={summary.series} />
      </div>
    </div>
  )
}
