'use client'

import { useMemo, useState } from 'react'
import { FinanceiroClientesConvertidosModal } from './financeiro-clientes-convertidos-modal'
import { Icon } from '@/components/ui/icons'
import { Pagination } from './pagination'
import { formatCentavos, formatCompetencia, type ValorMensalUnidade } from '@/lib/dashboard/financeiro-valor-mensal'

const PAGE_SIZE = 10

// Diferente de FinanceiroValorMensalHistoricoTable (que pivota o histórico inteiro
// pra Total + no máximo 1 unidade de comparação — a mesma trava de escala usada em
// toda a página), esta tabela é o oposto de propósito: granularidade completa de
// UMA competência por vez (unidade selecionada no topo controla qual mês), listando
// toda unidade que teve conversão naquele mês — é o "histórico com os valores e os
// clientes convertidos, em uma tabela de cada mês, de cada unidade" pedido pelo
// usuário. Só cabe sem estourar a tela porque olha um mês de cada vez, não a série
// inteira (a rede pode passar de 50 academias, mas "unidades ativas num mês" é bem
// menor que isso na prática, e ainda pagina).
export function FinanceiroDetalhamentoUnidadeTable({ rows }: { rows: ValorMensalUnidade[] }) {
  const competencias = useMemo(() => {
    const chaves = new Map<number, { ano: number; mes: number }>()
    for (const r of rows) chaves.set(r.ano * 100 + r.mes, { ano: r.ano, mes: r.mes })
    return Array.from(chaves.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, competencia]) => ({ key, ...competencia }))
  }, [rows])

  const [competenciaKey, setCompetenciaKey] = useState<number | null>(competencias[0]?.key ?? null)
  const [page, setPage] = useState(1)
  const [modalAlvo, setModalAlvo] = useState<{ academiaId: string; academiaNome: string } | null>(null)

  const competenciaAtual = competencias.find((c) => c.key === competenciaKey) ?? competencias[0] ?? null

  const linhas = useMemo(
    () =>
      competenciaAtual
        ? rows
            .filter((r) => r.ano === competenciaAtual.ano && r.mes === competenciaAtual.mes)
            .sort((a, b) => a.academiaNome.localeCompare(b.academiaNome, 'pt-BR'))
        : [],
    [rows, competenciaAtual]
  )

  if (competencias.length === 0 || !competenciaAtual) return null

  const totalPages = Math.max(1, Math.ceil(linhas.length / PAGE_SIZE))
  const paginaAtual = Math.min(page, totalPages)
  const linhasDaPagina = linhas.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-title mb-1">Detalhamento por unidade</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clientes ativados e valor de cada unidade num mês — &quot;Ver clientes&quot; mostra quem entrou na conta.
          </p>
        </div>
        {competencias.length > 1 && (
          <select
            value={competenciaAtual.key}
            onChange={(e) => {
              setCompetenciaKey(Number(e.target.value))
              setPage(1)
            }}
            aria-label="Competência"
            className="select h-9 w-40 py-1.5 text-sm"
          >
            {competencias.map((c) => (
              <option key={c.key} value={c.key}>
                {formatCompetencia(c.ano, c.mes)}
              </option>
            ))}
          </select>
        )}
      </div>

      {linhas.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhuma unidade com cliente ativado em {formatCompetencia(competenciaAtual.ano, competenciaAtual.mes)}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="py-2 pr-4 font-medium">Unidade</th>
                <th className="py-2 pr-4 text-right font-medium">Ativações</th>
                <th className="py-2 pr-4 text-right font-medium">Valor</th>
                <th className="py-2 pr-0 text-right font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {linhasDaPagina.map((linha) => (
                <tr key={linha.academiaId}>
                  <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{linha.academiaNome}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {linha.quantidadeConversoes}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                    {formatCentavos(linha.valorTotalCentavos)}
                  </td>
                  <td className="py-3 pr-0 text-right">
                    <button
                      type="button"
                      onClick={() => setModalAlvo({ academiaId: linha.academiaId, academiaNome: linha.academiaNome })}
                      disabled={linha.quantidadeConversoes === 0}
                      className="btn-secondary btn-sm inline-flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Icon name="users" className="h-3.5 w-3.5" />
                      Ver clientes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="-mx-5 -mb-5 mt-2">
        <Pagination page={paginaAtual} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <FinanceiroClientesConvertidosModal
        open={!!modalAlvo}
        onClose={() => setModalAlvo(null)}
        academiaId={modalAlvo?.academiaId ?? null}
        academiaNome={modalAlvo?.academiaNome ?? ''}
        ano={competenciaAtual.ano}
        mes={competenciaAtual.mes}
      />
    </div>
  )
}
