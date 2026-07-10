import { AcademiaPerformanceChart } from '@/components/dashboard/academia-performance-chart'
import { AcademiaTable } from '@/components/dashboard/academia-table'
import { ManualDataSection } from '@/components/dashboard/manual-data-section'
import { fetchAcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchManualDataHistory } from '@/lib/dashboard/fetch-manual-data-history'
import { canWrite, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

export default async function PerformancePage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  const [rows, academias, history] = await Promise.all([
    profile ? fetchAcademiaPerformance(profile) : Promise.resolve([]),
    fetchActiveAcademias(profile),
    profile && canWrite(profile.role) ? fetchManualDataHistory(profile) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Performance por academia</h2>
        <p className="page-subtitle">Totais acumulados de contatos e conversões por unidade.</p>
      </div>

      <AcademiaPerformanceChart rows={rows} />

      <AcademiaTable rows={rows} />

      {profile && canWrite(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Dados manuais</h3>
          <ManualDataSection
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
            history={history}
          />
        </div>
      )}
    </div>
  )
}
