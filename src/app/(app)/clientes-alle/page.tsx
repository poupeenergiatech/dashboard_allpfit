import { AcademiaFilterLinks } from '@/components/dashboard/academia-filter-links'
import { ClientesAlleForm } from '@/components/dashboard/clientes-alle-form'
import { ClientesAlleImportForm } from '@/components/dashboard/clientes-alle-import-form'
import { ClientesAlleStatusChart } from '@/components/dashboard/clientes-alle-status-chart'
import { ClientesAlleTable } from '@/components/dashboard/clientes-alle-table'
import { FunnelCard } from '@/components/dashboard/funnel-card'
import { Icon } from '@/components/ui/icons'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchClientesAlle } from '@/lib/dashboard/fetch-clientes-alle'
import { canManageClientesAlle, canManageUsers, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

export default async function ClientesAllePage({
  searchParams,
}: {
  searchParams: { academia?: string }
}) {
  const profile = await getCurrentUserProfile().catch(() => null)

  // Página inteira restrita a Super Admin e Direção (pedido explícito do usuário) —
  // reaproveita canManageUsers, o mesmo gate de visualização já usado em /academias,
  // /usuarios e /auditoria, em vez de criar mais uma função com regra idêntica.
  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        Acesso restrito a Super Admin e Direção.
      </div>
    )
  }

  const requestedAcademiaId = searchParams.academia ?? null

  const [clientes, academias] = await Promise.all([
    fetchClientesAlle(profile, requestedAcademiaId),
    fetchActiveAcademias(profile),
  ])

  // com_impedimentos/falta_documentos já aparecem separados no gráfico por status
  // abaixo — esse card só dá o total das duas somadas, pedido explícito do
  // usuário pra ter um número único de "Reprovados Alle" sem precisar somar as
  // duas barras do gráfico de cabeça. Calculado aqui em cima do array já
  // buscado, sem query extra.
  const totalReprovadosAlle = clientes.filter(
    (c) => c.status === 'com_impedimentos' || c.status === 'falta_documentos'
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Clientes Alle</h2>
        {/* Descrição visível só pro Super Admin, pedido explícito do usuário. */}
        {profile.role === 'super_admin' && (
          <p className="page-subtitle">
            Clientes da Alle Energia por academia — ativos (já assinaram o termo de adesão) e pendentes (ainda
            faltando assinar). Acesso restrito a Super Admin e Direção; cadastro, edição e exclusão são exclusivos
            de Super Admin.
          </p>
        )}
      </div>

      <AcademiaFilterLinks basePath="/clientes-alle" academias={academias} academiaId={requestedAcademiaId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FunnelCard
          label="Reprovados Alle"
          value={totalReprovadosAlle}
          icon={<Icon name="warning" className="h-[18px] w-[18px]" />}
          accent="violet"
        />
      </div>

      <ClientesAlleStatusChart clientes={clientes} />

      <ClientesAlleTable
        clientes={clientes}
        academias={academias}
        editable={canManageClientesAlle(profile.role)}
      />

      {canManageClientesAlle(profile.role) && (
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
