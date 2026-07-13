import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { PendenciaSection } from '@/components/dashboard/pendencia-section'
import { PendenciasPorAcademiaChart } from '@/components/dashboard/pendencias-por-academia-chart'
import { PendenciasTrendChart } from '@/components/dashboard/pendencias-trend-chart'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import {
  fetchPendenciasHistory,
  fetchPendenciasPorAcademia,
  fetchPendenciasTrend,
} from '@/lib/dashboard/fetch-pendencias-assinatura'
import { canWrite, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

export default async function PendentesPage({
  searchParams,
}: {
  searchParams: { academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)
  const requestedAcademiaId = searchParams.academia ?? null

  const [porAcademia, trend, academias, history] = await Promise.all([
    profile ? fetchPendenciasPorAcademia(profile, requestedAcademiaId) : Promise.resolve([]),
    profile ? fetchPendenciasTrend(profile, requestedAcademiaId) : Promise.resolve([]),
    fetchActiveAcademias(profile),
    profile && canWrite(profile.role) ? fetchPendenciasHistory(profile, requestedAcademiaId) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Pendentes de assinatura</h2>
        <p className="page-subtitle">Quantos alunos estão com assinatura de termo pendente, por academia.</p>
      </div>

      <AcademiaFilterLinks basePath="/pendentes" academias={academias} academiaId={requestedAcademiaId} />

      <PendenciasPorAcademiaChart rows={porAcademia} />
      <PendenciasTrendChart series={trend} />

      {profile && canWrite(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Lançar pendências</h3>
          <PendenciaSection
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
            history={history}
          />
        </div>
      )}
    </div>
  )
}
