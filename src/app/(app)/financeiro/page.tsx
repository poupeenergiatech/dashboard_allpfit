import { FinanceiroConversionsForecastChart } from '@/components/dashboard/financeiro-conversions-forecast-chart'
import { FinanceiroInvoicesTable } from '@/components/dashboard/financeiro-invoices-table'
import { FinanceiroRevenueChart } from '@/components/dashboard/financeiro-revenue-chart'
import { FinanceiroSummaryCards } from '@/components/dashboard/financeiro-summary-cards'
import { FinanceiroUnidadesTable } from '@/components/dashboard/financeiro-unidades-table'
import { NotasFiscaisCalendar } from '@/components/dashboard/notas-fiscais-calendar'
import { canAccessFinanceiro, canManageNotasFiscais, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'

export default async function FinanceiroPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canAccessFinanceiro(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        Acesso restrito a Super Admin, Gestor e Coordenador.
      </div>
    )
  }

  const academias = await fetchActiveAcademias(profile)
  const fixedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Financeiro</h2>
        <p className="page-subtitle">
          Layout inicial com dados de exemplo — os números abaixo ainda não vêm de uma fonte real.
        </p>
      </div>

      <FinanceiroSummaryCards />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FinanceiroRevenueChart />
        <FinanceiroConversionsForecastChart />
      </div>
      <FinanceiroUnidadesTable />
      <FinanceiroInvoicesTable />
      <NotasFiscaisCalendar
        academias={academias}
        initialAcademiaId={fixedAcademiaId}
        canManage={canManageNotasFiscais(profile.role)}
      />
    </div>
  )
}
