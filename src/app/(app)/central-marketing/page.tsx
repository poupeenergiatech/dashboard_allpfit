import { MateriaisGrid } from '@/components/dashboard/materiais-marketing-grid'
import { canManageMateriaisMarketing, getCurrentUserProfile } from '@/lib/auth/profile'
import { fetchMateriais } from '@/lib/dashboard/fetch-materiais-marketing'

export default async function CentralMarketingPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const materiais = await fetchMateriais()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Central de Marketing</h2>
        <p className="page-subtitle">
          Materiais de aula, vídeos, marketing, treinamento e instruções — link externo, aberto numa nova aba.
        </p>
      </div>

      <MateriaisGrid materiais={materiais} canManage={!!profile && canManageMateriaisMarketing(profile.role)} />
    </div>
  )
}
