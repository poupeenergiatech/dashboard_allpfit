'use client'

import { useMemo, useState } from 'react'
import { Pagination } from './pagination'
import { formatCentavos, formatCompetencia, type ValorMensalUnidade } from '@/lib/dashboard/financeiro-valor-mensal'

const PAGE_SIZE = 6

type Linha = { key: number; competencia: string; total: number; comparar: number | undefined }

// Uma coluna por academia não escala (mesmo problema do gráfico e dos cards — a rede
// já passa de 50 academias): por padrão só a coluna Total, com um seletor opcional
// pra abrir a coluna de UMA unidade específica, em vez de listar todas de uma vez.
function pivot(rows: ValorMensalUnidade[], compararId: string): Linha[] {
  const porCompetencia = new Map<number, Linha>()

  for (const r of rows) {
    const key = r.ano * 100 + r.mes
    const linha = porCompetencia.get(key) ?? {
      key,
      competencia: formatCompetencia(r.ano, r.mes),
      total: 0,
      comparar: compararId ? 0 : undefined,
    }
    linha.total += r.valorTotalCentavos
    if (compararId && r.academiaId === compararId) linha.comparar = r.valorTotalCentavos
    porCompetencia.set(key, linha)
  }

  return Array.from(porCompetencia.values()).sort((a, b) => b.key - a.key)
}

// compararId é controlado pelo pai (financeiro-valor-mensal-section.tsx) — o mesmo
// filtro escolhido nos cards reflete aqui e no gráfico, sem select próprio duplicado.
export function FinanceiroValorMensalHistoricoTable({
  rows,
  compararId,
}: {
  rows: ValorMensalUnidade[]
  compararId: string
}) {
  const [page, setPage] = useState(1)

  const academias = useMemo(() => {
    const porId = new Map<string, string>()
    for (const r of rows) porId.set(r.academiaId, r.academiaNome)
    return Array.from(porId.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [rows])

  const linhas = useMemo(() => pivot(rows, compararId), [rows, compararId])
  if (linhas.length === 0) return null

  const comparar = academias.find((a) => a.id === compararId)
  // Clampado na renderização (sem useEffect): se a página guardada ficar fora do
  // alcance depois que `linhas` muda de tamanho, cai pra última página válida em
  // vez de mostrar uma tabela vazia com "Página 3 de 1".
  const totalPages = Math.max(1, Math.ceil(linhas.length / PAGE_SIZE))
  const paginaAtual = Math.min(page, totalPages)
  const linhasDaPagina = linhas.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  return (
    <div className="card p-5">
      <div className="mb-3">
        <p className="panel-title mb-1">
          Histórico do valor mensal
          {comparar && <span className="font-normal text-slate-400 dark:text-slate-500"> · coluna extra: {comparar.nome}</span>}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conversões daquele mês específico x valor por conversão vigente na época.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th className="py-2 pr-4 font-medium">Mês</th>
              <th className="py-2 pr-4 text-right font-medium">Total</th>
              {comparar && <th className="py-2 text-right font-medium">{comparar.nome}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {linhasDaPagina.map((linha) => (
              <tr key={linha.key}>
                <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{linha.competencia}</td>
                <td className="py-3 pr-4 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                  {formatCentavos(linha.total)}
                </td>
                {comparar && (
                  <td className="py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {formatCentavos(linha.comparar ?? 0)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* -mx-5 -mb-5: cancela o padding do card pra o rodapé de paginação ir de
          ponta a ponta, mesmo efeito visual das outras tabelas paginadas do app
          (ver funnel-daily-history-table.tsx), que usam um card sem padding próprio. */}
      <div className="-mx-5 -mb-5 mt-2">
        <Pagination page={paginaAtual} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
