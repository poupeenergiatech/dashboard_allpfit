import { TreinadasGrid } from '@/components/dashboard/treinadas-grid'
import { fetchTreinadas } from '@/lib/dashboard/fetch-treinadas'
import { canManageTraining, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function TreinadasPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = profile ? await fetchTreinadas(profile) : []
  const canEdit = !!profile && canManageTraining(profile.role)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Academias treinadas</h2>
        {/* Descrição visível só pro Super Admin, pedido explícito do usuário — canEdit
            já equivale a super_admin aqui (ver canManageTraining). */}
        {canEdit && <p className="page-subtitle">Marque as unidades que já passaram pelo treinamento.</p>}
      </div>

      <TreinadasGrid rows={rows} canEdit={canEdit} />
    </div>
  )
}
