import { AcademiaTable } from '@/components/dashboard/academia-table'
import { ManualDataForm } from '@/components/dashboard/manual-data-form'
import { fetchAcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'
import { createClient } from '@/lib/supabase/server'
import { canWrite, getCurrentUserProfile, seesAllAcademias } from '@/lib/supabase/profile'

export default async function PerformancePage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  const [rows, academiasResult] = await Promise.all([
    fetchAcademiaPerformance(),
    createClient().from('academias').select('id, nome').eq('ativo', true).order('nome'),
  ])

  const academias = academiasResult.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Performance por academia</h2>
        <p className="text-sm text-slate-500">Totais acumulados de contatos e conversões por unidade.</p>
      </div>

      <AcademiaTable rows={rows} />

      {profile && canWrite(profile.role) && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Atualizar dados manuais do dia</h3>
          <ManualDataForm
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
          />
        </div>
      )}
    </div>
  )
}
