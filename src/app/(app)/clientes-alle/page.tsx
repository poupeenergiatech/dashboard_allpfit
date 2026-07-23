import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { ClientesAlleForm } from '@/components/dashboard/clientes-alle-form'
import { ClientesAlleImportForm } from '@/components/dashboard/clientes-alle-import-form'
import { ClientesAlleStatusChart } from '@/components/dashboard/clientes-alle-status-chart'
import { ClientesAlleTable } from '@/components/dashboard/clientes-alle-table'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchClientesAlle } from '@/lib/dashboard/fetch-clientes-alle'
import { canManageManualData, canManageUsers, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

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
        <p className="page-subtitle">
          Clientes da Alle Energia por academia — ativos (já assinaram o termo de adesão) e pendentes (ainda
          faltando assinar).
        </p>
      </div>

      <AcademiaFilterLinks basePath="/clientes-alle" academias={academias} academiaId={requestedAcademiaId} />

      <ClientesAlleStatusChart clientes={clientes} />

      <ClientesAlleTable
        clientes={clientes}
        academias={academias}
        editable={!!profile && canManageManualData(profile.role)}
      />

      {profile && canManageUsers(profile.role) && (
        <>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Cadastrar cliente</h3>
            <ClientesAlleForm
              academias={academias}
              fixedAcademiaId={seesAllAcademias(profile.role) ? null : profile.academiaId}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Importar lista (CSV)</h3>
            <ClientesAlleImportForm />
          </div>
        </>
      )}
    </div>
  )
}
