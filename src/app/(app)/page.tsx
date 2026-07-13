import { FunnelDashboard } from '@/components/dashboard/funnel-dashboard'
import { canWrite, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchManualDataHistory } from '@/lib/dashboard/fetch-manual-data-history'

export default async function DashboardHomePage() {
  const profile = await getCurrentUserProfile().catch((err: unknown) => {
    return err instanceof Error ? err.message : 'Erro ao carregar perfil do usuário'
  })

  if (typeof profile === 'string' || !profile) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-sm font-medium text-amber-800">
        {typeof profile === 'string' ? profile : 'Nenhum perfil encontrado para este usuário.'}
      </div>
    )
  }

  const canEdit = canWrite(profile.role)
  const fixedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const [academias, history] = await Promise.all([
    fetchActiveAcademias(profile),
    canEdit ? fetchManualDataHistory(profile) : Promise.resolve([]),
  ])

  return (
    <FunnelDashboard
      academias={academias}
      initialAcademiaId={fixedAcademiaId}
      canEdit={canEdit}
      manualDataHistory={history}
    />
  )
}
