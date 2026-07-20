import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { ClientesConvertidosTable } from '@/components/dashboard/clientes-convertidos-table'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchClientesConvertidos } from '@/lib/dashboard/fetch-clientes-convertidos'
import { getCurrentUserProfile } from '@/lib/auth/profile'

export default async function ConvertidosPage({
  searchParams,
}: {
  searchParams: { academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)
  const requestedAcademiaId = searchParams.academia ?? null

  const [clientes, academias] = await Promise.all([
    profile ? fetchClientesConvertidos(profile, requestedAcademiaId) : Promise.resolve([]),
    fetchActiveAcademias(profile),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Clientes convertidos</h2>
        <p className="page-subtitle">
          Convertidos automaticamente pela Ane (sync do Alle Documentos), com nome e telefone — inclui quem ainda
          está sem unidade vinculada, quando o filtro é &quot;Todas as academias&quot;.
        </p>
      </div>

      <AcademiaFilterLinks basePath="/convertidos" academias={academias} academiaId={requestedAcademiaId} />

      <ClientesConvertidosTable clientes={clientes} />
    </div>
  )
}
