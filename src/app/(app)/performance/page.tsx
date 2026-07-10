import { AcademiaTable } from '@/components/dashboard/academia-table'
import { ManualDataForm } from '@/components/dashboard/manual-data-form'
import { fetchAcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { canWrite, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

export default async function PerformancePage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  const [rows, academias] = await Promise.all([
    profile ? fetchAcademiaPerformance(profile) : Promise.resolve([]),
    fetchActiveAcademias(profile),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Performance por academia</h2>
        <p className="page-subtitle">Totais acumulados de contatos e conversões por unidade.</p>
      </div>

      <AcademiaTable rows={rows} />

      {profile && canWrite(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Atualizar dados manuais do dia</h3>
          <ManualDataForm
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
          />
        </div>
      )}
    </div>
  )
}
