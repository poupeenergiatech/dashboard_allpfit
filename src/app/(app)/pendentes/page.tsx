import { PendentesList } from '@/components/dashboard/pendentes-list'
import { fetchPendingSignatures } from '@/lib/dashboard/fetch-pendentes'
import { canWrite, getCurrentUserProfile } from '@/lib/supabase/profile'

export default async function PendentesPage() {
  const profile = await getCurrentUserProfile().catch(() => null)
  const rows = await fetchPendingSignatures()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Pendentes de assinatura</h2>
        <p className="text-sm text-slate-500">Clientes que ainda não assinaram o termo.</p>
      </div>

      <PendentesList rows={rows} canEdit={!!profile && canWrite(profile.role)} />
    </div>
  )
}
