import { FunnelDashboard } from '@/components/dashboard/funnel-dashboard'
import { canManageManualData, canManageUsers, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchManualDataHistory } from '@/lib/dashboard/fetch-manual-data-history'

export default async function DashboardHomePage() {
  const profile = await getCurrentUserProfile().catch((err: unknown) => {
    return err instanceof Error ? err.message : 'Erro ao carregar perfil do usuário'
  })

  if (typeof profile === 'string' || !profile) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        {typeof profile === 'string' ? profile : 'Nenhum perfil encontrado para este usuário.'}
      </div>
    )
  }

  const canEditManualData = canManageManualData(profile.role)
  const fixedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  // Dados manuais e histórico agora são visíveis (leitura) pra qualquer role
  // autenticada — só a edição fica restrita, ver canManageManualData.
  const [academias, history] = await Promise.all([fetchActiveAcademias(profile), fetchManualDataHistory(profile)])

  return (
    <FunnelDashboard
      academias={academias}
      initialAcademiaId={fixedAcademiaId}
      canEditManualData={canEditManualData}
      isSuperAdmin={canManageUsers(profile.role)}
      manualDataHistory={history}
    />
  )
}
