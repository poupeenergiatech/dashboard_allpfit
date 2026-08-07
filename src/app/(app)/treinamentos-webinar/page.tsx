import { createTreinamentoWebinar, deleteTreinamentoWebinar, updateTreinamentoWebinar } from './actions'
import { MateriaisGrid } from '@/components/dashboard/materiais-grid'
import { canManageTreinamentosWebinar, getCurrentUserProfile } from '@/lib/auth/profile'
import { fetchTreinamentosWebinar } from '@/lib/dashboard/fetch-treinamentos-webinar'

export default async function TreinamentosWebinarPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const materiais = await fetchTreinamentosWebinar()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Treinamentos e Webinar</h2>
        <p className="page-subtitle">Treinamentos, aulas e gravações de webinar — link externo, aberto numa nova aba.</p>
      </div>

      <MateriaisGrid
        materiais={materiais}
        canManage={!!profile && canManageTreinamentosWebinar(profile.role)}
        onCreate={createTreinamentoWebinar}
        onUpdate={updateTreinamentoWebinar}
        onDelete={deleteTreinamentoWebinar}
      />
    </div>
  )
}
