import { FunnelDashboard } from '@/components/dashboard/funnel-dashboard'
import { canLaunchManualScans, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'
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

  const fixedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  // Histórico de dados manuais é visível (leitura) pra qualquer role autenticada —
  // só lançar/editar fica restrito a Super Admin, ver isSuperAdmin em FunnelDashboard.
  const [academias, history] = await Promise.all([fetchActiveAcademias(profile), fetchManualDataHistory(profile)])

  return (
    <FunnelDashboard
      academias={academias}
      initialAcademiaId={fixedAcademiaId}
      isSuperAdmin={canLaunchManualScans(profile.role)}
      manualDataHistory={history}
    />
  )
}
