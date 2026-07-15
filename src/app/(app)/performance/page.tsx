import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { AcademiaPerformanceChart } from '@/components/dashboard/academia-performance-chart'
import { AcademiaTable } from '@/components/dashboard/academia-table'
import { ManualDataSection } from '@/components/dashboard/manual-data-section'
import { PeriodFilterLinks } from '@/components/dashboard/period-filter-links'
import { fetchAcademiaPerformance, type PerformancePeriod } from '@/lib/dashboard/fetch-academia-performance'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchManualDataHistory } from '@/lib/dashboard/fetch-manual-data-history'
import { canManageManualData, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'
import type { DateRange } from '@/lib/dashboard/types'

const VALID_PERIODS: PerformancePeriod[] = ['todos', 'hoje', 'ontem', '7dias', '30dias', 'personalizado']

function defaultCustomRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string; academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)

  const period: PerformancePeriod = VALID_PERIODS.includes(searchParams.period as PerformancePeriod)
    ? (searchParams.period as PerformancePeriod)
    : 'todos'
  const customRange: DateRange | null =
    period === 'personalizado'
      ? searchParams.from && searchParams.to
        ? { from: searchParams.from, to: searchParams.to }
        : defaultCustomRange()
      : null
  const requestedAcademiaId = searchParams.academia ?? null

  const [rows, academias, history] = await Promise.all([
    profile ? fetchAcademiaPerformance(profile, period, customRange, requestedAcademiaId) : Promise.resolve([]),
    fetchActiveAcademias(profile),
    // Dados manuais e histórico agora são visíveis (leitura) pra qualquer role
    // autenticada — só a edição fica restrita, ver canManageManualData abaixo.
    profile ? fetchManualDataHistory(profile) : Promise.resolve([]),
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
        <h2 className="page-title">Performance por academia</h2>
        <p className="page-subtitle">Totais de contatos e conversões por unidade, no período selecionado.</p>
      </div>

      <PeriodFilterLinks
        basePath="/performance"
        period={period}
        customRange={customRange}
        extraParams={periodExtraParams}
      />
      <AcademiaFilterLinks
        basePath="/performance"
        academias={academias}
        academiaId={requestedAcademiaId}
        extraParams={academiaExtraParams}
      />

      <AcademiaPerformanceChart rows={rows} />

      <AcademiaTable rows={rows} />

      {profile && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Dados manuais</h3>
          <ManualDataSection
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
            history={history}
            editable={canManageManualData(profile.role)}
          />
        </div>
      )}
    </div>
  )
}
