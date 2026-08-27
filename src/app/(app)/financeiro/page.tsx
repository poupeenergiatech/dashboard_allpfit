import { FinanceiroContent } from '@/components/dashboard/financeiro-content'
import {
  canAccessFinanceiro,
  canManageNotasFiscais,
  canValidateNotasFiscais,
  canViewNotasFiscaisHistorico,
  getCurrentUserProfile,
  seesAllAcademias,
} from '@/lib/auth/profile'
import { fetchActiveAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchFinanceiroVisivelOutrosCargos } from '@/lib/dashboard/fetch-financeiro-visibility'
import { fetchHistoricoValorMensal } from '@/lib/dashboard/fetch-financeiro-valor-mensal'

export default async function FinanceiroPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  // Super Admin nunca passa pela checagem de visibilidade abaixo — só ele liga/
  // desliga o toggle em /configuracoes, então precisa continuar acessando mesmo
  // com a página "oculta" pros outros cargos (ver FinanceiroVisibilityToggle).
  const financeiroOculto =
    !!profile && profile.role !== 'super_admin' && !(await fetchFinanceiroVisivelOutrosCargos())

  if (!profile || !canAccessFinanceiro(profile.role) || financeiroOculto) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        {financeiroOculto
          ? 'Financeiro está temporariamente oculto pelo Super Admin. Fale com um Super Admin se precisar de acesso.'
          : 'Acesso restrito a Super Admin, Direção e Gestor.'}
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
        {/* Descrição visível só pro Super Admin, pedido explícito do usuário. */}
        {profile.role === 'super_admin' && <p className="page-subtitle">Valor mensal por unidade, histórico e notas fiscais.</p>}
      </div>

      <FinanceiroContent
        valorMensalRows={valorMensalRows}
        academias={academias}
        fixedAcademiaId={fixedAcademiaId}
        canManageNotasFiscais={canManageNotasFiscais(profile.role)}
        canViewNotasFiscaisHistorico={canViewNotasFiscaisHistorico(profile.role)}
        canValidateNotasFiscais={canValidateNotasFiscais(profile.role)}
        isSuperAdmin={profile.role === 'super_admin'}
      />
    </div>
  )
}
