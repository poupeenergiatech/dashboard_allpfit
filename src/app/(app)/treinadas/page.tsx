import { TreinadasGrid } from '@/components/dashboard/treinadas-grid'
import { fetchTreinadas } from '@/lib/dashboard/fetch-treinadas'
import { canManageTraining, getCurrentUserProfile } from '@/lib/supabase/profile'

export default async function TreinadasPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = await fetchTreinadas()
  const canEdit = !!profile && canManageTraining(profile.role)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Academias treinadas</h2>
        <p className="text-sm text-slate-500">
          {canEdit
            ? 'Marque as unidades que já passaram pelo treinamento.'
            : 'Somente Super Admin e Gestor podem alterar esse status.'}
        </p>
      </div>

      <TreinadasGrid rows={rows} canEdit={canEdit} />
    </div>
  )
}
