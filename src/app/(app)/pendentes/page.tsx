import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { PendenciaSection } from '@/components/dashboard/pendencia-section'
import { PendenciasPorAcademiaChart } from '@/components/dashboard/pendencias-por-academia-chart'
import { PendenciasTotalCard } from '@/components/dashboard/pendencias-total-card'
import { PendenciasTrendChart } from '@/components/dashboard/pendencias-trend-chart'
import { ResetPendenciasButton } from '@/components/dashboard/reset-pendencias-button'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import {
  fetchPendenciasHistory,
  fetchPendenciasPorAcademia,
  fetchPendenciasTrend,
} from '@/lib/dashboard/fetch-pendencias-assinatura'
import { canManagePendencias, canManageUsers, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

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
    // Leitura do histórico é liberada pra qualquer role (mesmo padrão de dados
    // manuais, ver canManagePendencias) — só lançar/editar fica restrito.
    profile ? fetchPendenciasHistory(profile, requestedAcademiaId) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Pendentes de assinatura</h2>
        <p className="page-subtitle">
          Quantos alunos estão com assinatura de termo pendente, por academia — soma o lançamento manual com os
          clientes de status &quot;Pendente&quot; em /clientes-alle.
        </p>
      </div>

      <AcademiaFilterLinks basePath="/pendentes" academias={academias} academiaId={requestedAcademiaId} />

      <PendenciasTotalCard rows={porAcademia} />

      <PendenciasPorAcademiaChart rows={porAcademia} />
      <PendenciasTrendChart series={trend} />

      {profile && (
        <div>
          {canManagePendencias(profile.role) && (
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Lançar pendências</h3>
          )}
          <PendenciaSection
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
            history={history}
            editable={canManagePendencias(profile.role)}
          />
        </div>
      )}

      {profile && canManageUsers(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">Zona de risco</h3>
          <ResetPendenciasButton />
        </div>
      )}
    </div>
  )
}
