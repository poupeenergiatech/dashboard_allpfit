import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { AlunosPendentesTable } from '@/components/dashboard/alunos-pendentes-table'
import { PendenciaSection } from '@/components/dashboard/pendencia-section'
import { PendenciasPorAcademiaChart } from '@/components/dashboard/pendencias-por-academia-chart'
import { PendenciasTotalCard } from '@/components/dashboard/pendencias-total-card'
import { PendenciasTrendChart } from '@/components/dashboard/pendencias-trend-chart'
import { ResetPendenciasButton } from '@/components/dashboard/reset-pendencias-button'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchClientesAllePendentes } from '@/lib/dashboard/fetch-clientes-alle'
import {
  fetchPendenciasHistory,
  fetchPendenciasPorAcademia,
  fetchPendenciasTrend,
} from '@/lib/dashboard/fetch-pendencias-assinatura'
import {
  canManageConfiguracoes,
  canManagePendencias,
  canViewAlunosPendentesList,
  getCurrentUserProfile,
  seesAllAcademias,
} from '@/lib/auth/profile'

export default async function PendentesPage({
  searchParams,
}: {
  searchParams: { academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)
  const requestedAcademiaId = searchParams.academia ?? null

  const [porAcademia, trend, academias, history, alunosPendentes] = await Promise.all([
    profile ? fetchPendenciasPorAcademia(profile, requestedAcademiaId) : Promise.resolve([]),
    profile ? fetchPendenciasTrend(profile, requestedAcademiaId) : Promise.resolve([]),
    fetchActiveAcademias(profile),
    // Leitura do histórico é liberada pra qualquer role (mesmo padrão de dados
    // manuais, ver canManagePendencias) — só lançar/editar fica restrito.
    profile ? fetchPendenciasHistory(profile, requestedAcademiaId) : Promise.resolve([]),
    // Lista nominal — só Gestor (ver canViewAlunosPendentesList); pra quem não
    // tem acesso, nem busca no banco.
    profile && canViewAlunosPendentesList(profile.role)
      ? fetchClientesAllePendentes(profile, requestedAcademiaId)
      : Promise.resolve([]),
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

      {profile && canViewAlunosPendentesList(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Alunos pendentes de assinatura</h3>
          <AlunosPendentesTable clientes={alunosPendentes} />
        </div>
      )}

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

      {profile && canManageConfiguracoes(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-400">Zona de risco</h3>
          <ResetPendenciasButton />
        </div>
      )}
    </div>
  )
}
