import { FinanceiroContent } from '@/components/dashboard/financeiro-content'
import { canAccessFinanceiro, canManageNotasFiscais, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchHistoricoValorMensal } from '@/lib/dashboard/fetch-financeiro-valor-mensal'

export default async function FinanceiroPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canAccessFinanceiro(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        Acesso restrito a Super Admin, Direção e Gestor.
      </div>
    )
  }

  const academias = await fetchActiveAcademias(profile)
  const fixedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId
  const valorMensalRows = await fetchHistoricoValorMensal(profile)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Financeiro</h2>
        <p className="page-subtitle">Valor mensal por unidade, histórico e notas fiscais.</p>
      </div>

      <FinanceiroContent
        valorMensalRows={valorMensalRows}
        academias={academias}
        fixedAcademiaId={fixedAcademiaId}
        canManageNotasFiscais={canManageNotasFiscais(profile.role)}
      />
    </div>
  )
}
