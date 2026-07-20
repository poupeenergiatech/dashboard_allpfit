import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { ClientesAlleForm } from '@/components/dashboard/clientes-alle-form'
import { ClientesAlleTable } from '@/components/dashboard/clientes-alle-table'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchClientesAlle } from '@/lib/dashboard/fetch-clientes-alle'
import { canManageManualData, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

export default async function ClientesAllePage({
  searchParams,
}: {
  searchParams: { academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)
  const requestedAcademiaId = searchParams.academia ?? null

  const [clientes, academias] = await Promise.all([
    profile ? fetchClientesAlle(profile, requestedAcademiaId) : Promise.resolve([]),
    fetchActiveAcademias(profile),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Clientes Alle</h2>
        <p className="page-subtitle">Clientes ativos na Alle Energia, cadastrados manualmente por academia.</p>
      </div>

      <AcademiaFilterLinks basePath="/clientes-alle" academias={academias} academiaId={requestedAcademiaId} />

      <ClientesAlleTable
        clientes={clientes}
        academias={academias}
        editable={!!profile && canManageManualData(profile.role)}
      />

      {profile && canManageManualData(profile.role) && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Cadastrar cliente</h3>
          <ClientesAlleForm
            academias={academias}
            fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
          />
        </div>
      )}
    </div>
  )
}
