'use client'

import { useMemo } from 'react'
import { Icon } from '@/components/ui/icons'
import { formatCentavos, formatCompetencia, type ValorMensalUnidade } from '@/lib/dashboard/financeiro-valor-mensal'

// Linhas da competência mais recente presente no histórico (normalmente o mês
// corrente, já recalculado no carregamento da página — ver fetchHistoricoValorMensal).
function competenciaAtual(rows: ValorMensalUnidade[]): ValorMensalUnidade[] {
  if (rows.length === 0) return []
  const maisRecente = Math.max(...rows.map((r) => r.ano * 100 + r.mes))
  return rows.filter((r) => r.ano * 100 + r.mes === maisRecente)
}

function StatBlock({
  label,
  valorCentavos,
  quantidadeConversoes,
  accent,
}: {
  label: string
  valorCentavos: number
  quantidadeConversoes: number
  accent?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
          {formatCentavos(valorCentavos)}
        </p>
        <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
          {quantidadeConversoes} {quantidadeConversoes === 1 ? 'conversão' : 'conversões'} no mês
        </p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          accent
            ? 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400'
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        }`}
      >
        <Icon name="money" className="h-5 w-5" />
      </span>
    </div>
  )
}

// Um card por unidade não escala (mesmo problema do gráfico — a rede já passa de 50
// academias): por padrão um único painel de largura total com o Total (soma de
// todas as unidades no mês), mesmo padrão visual das outras seções da página
// (.card p-6, filtro no cabeçalho). Escolher uma unidade no filtro divide o painel
// em dois blocos lado a lado (Total | unidade), sem nunca virar uma grade com
// colunas vazias — o painel inteiro é sempre ocupado, com 1 ou 2 blocos.
export function FinanceiroValorMensalCards({
  rows,
  compararId,
  onCompararChange,
}: {
  rows: ValorMensalUnidade[]
  compararId: string
  onCompararChange: (id: string) => void
}) {
  const atuais = useMemo(() => competenciaAtual(rows), [rows])

  const academias = useMemo(
    () => [...atuais].sort((a, b) => a.academiaNome.localeCompare(b.academiaNome, 'pt-BR')),
    [atuais]
  )

  if (atuais.length === 0) return null

  const totalCentavos = atuais.reduce((sum, r) => sum + r.valorTotalCentavos, 0)
  const totalConversoes = atuais.reduce((sum, r) => sum + r.quantidadeConversoes, 0)
  const comparar = atuais.find((r) => r.academiaId === compararId)

  return (
    <div className="card p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-title">Valor mensal por unidade</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatCompetencia(atuais[0].ano, atuais[0].mes)} · conversões do mês x{' '}
            {formatCentavos(atuais[0].valorPorConversaoCentavos)} cada
          </p>
        </div>
        {academias.length > 1 && (
          <select
            value={compararId}
            onChange={(e) => onCompararChange(e.target.value)}
            aria-label="Comparar uma unidade com o total"
            className="select h-9 w-64 py-1.5 text-sm"
          >
            <option value="">Total (todas as unidades)</option>
            {academias.map((a) => (
              <option key={a.academiaId} value={a.academiaId}>
                Comparar com {a.academiaNome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        className={`grid grid-cols-1 gap-6 ${
          comparar ? 'sm:grid-cols-2 sm:divide-x sm:divide-slate-100 dark:sm:divide-slate-800' : ''
        }`}
      >
        <StatBlock label="Total (todas as unidades)" valorCentavos={totalCentavos} quantidadeConversoes={totalConversoes} />
        {comparar && (
          <div className="sm:pl-6">
            <StatBlock label={comparar.academiaNome} valorCentavos={comparar.valorTotalCentavos} quantidadeConversoes={comparar.quantidadeConversoes} accent />
          </div>
        )}
      </div>
    </div>
  )
}
