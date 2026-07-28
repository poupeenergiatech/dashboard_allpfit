import { GestoresPanelDashboard } from '@/components/dashboard/gestores-panel-dashboard'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
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

  // Sem profile aqui de propósito — fetchActiveAcademias(profile) escoparia pra
  // uma unidade só no caso de coordenador, mas o painel mostra todas pra quem tem
  // acesso (ver canAccessPainelGestores), então o filtro precisa listar todas
  // também, não só a do usuário.
  const academias = await fetchActiveAcademias()

  return <GestoresPanelDashboard academias={academias} />
}
