import { FunnelDashboard } from '@/components/dashboard/funnel-dashboard'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

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

  const academias = await fetchActiveAcademias(profile)

  return (
    <FunnelDashboard
      academias={academias}
      initialAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
    />
  )
}
