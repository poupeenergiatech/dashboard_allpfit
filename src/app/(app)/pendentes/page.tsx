import { PendentesList } from '@/components/dashboard/pendentes-list'
import { fetchPendingSignatures } from '@/lib/dashboard/fetch-pendentes'
import { canWrite, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function PendentesPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = profile ? await fetchPendingSignatures(profile) : []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">Pendentes de assinatura</h2>
        <p className="page-subtitle">Clientes que ainda não assinaram o termo.</p>
      </div>

      <PendentesList rows={rows} canEdit={!!profile && canWrite(profile.role)} />
    </div>
  )
}
