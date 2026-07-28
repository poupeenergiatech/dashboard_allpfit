import { GestoresPanelDashboard } from '@/components/dashboard/gestores-panel-dashboard'
import { canAccessPainelGestores, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function GestoresPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canAccessPainelGestores(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        Acesso restrito a gestores.
      </div>
    )
  }

  return <GestoresPanelDashboard />
}
