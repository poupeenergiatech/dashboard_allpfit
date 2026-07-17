'use client'

import { Fragment, useState } from 'react'
import { Pagination } from './pagination'
import { ScansBreakdownTable } from './scans-breakdown-table'
import { Icon } from '@/components/ui/icons'
import type { DailyFunnelPoint } from '@/lib/dashboard/types'

const PAGE_SIZE = 15

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Icon
      name="chevron-down"
      strokeWidth={2.5}
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    />
  )
}

// Detalhe por academia daquele dia — só faz sentido expandir quando o filtro é
// "todas" (mais de uma academia no escopo); com uma só, a coluna Scans já é o
// detalhe. Mostra toda academia no escopo, inclusive as com 0 naquele dia: é
// isso que dá transparência sobre quem não reportou, não só quem reportou.
function ScansPorAcademiaRow({ point }: { point: DailyFunnelPoint }) {
  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 px-4 py-4">
          <ScansBreakdownTable rows={point.scansPorAcademia} />
        </div>
      </td>
    </tr>
  )
}

// Mais recente primeiro, igual às outras tabelas de histórico do app (manual_data,
// pendencias_assinatura) — só que aqui é sempre derivada (alunos/scans vêm de
// manual_data, contatos/conversões de contacts/conversions + ajuste), sem ação de
// editar: a edição continua em /performance e /pendentes.
//
// Paginado (15/página) porque período "Personalizado" pode cobrir meses — sem isso
// a tabela cresce sem limite. O componente pai remonta (via `key`) quando o filtro
// muda, então a paginação não precisa se resetar sozinha a cada poll de 10s do funil.
export function FunnelDailyHistoryTable({ series }: { series: DailyFunnelPoint[] }) {
  const [page, setPage] = useState(1)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  if (series.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum dado no período selecionado.</div>
  }

  const rows = [...series].reverse()
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // Só vale o aviso quando pelo menos um dia da página tem mais de uma academia no
  // escopo — com filtro de uma única academia, nenhuma linha é expansível.
  const hasBreakdown = rows.some((r) => r.scansPorAcademia.length > 1)

  return (
    <div className="card overflow-x-auto">
      {hasBreakdown && (
        <p className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
          Clique no total de <span className="font-medium text-slate-600 dark:text-slate-300">Scans</span> pra ver o detalhe por
          academia.
        </p>
      )}
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Alunos</th>
            <th className="px-4 py-3 text-right">Scans</th>
            <th className="px-4 py-3 text-right">Contatos</th>
            <th className="px-4 py-3 text-right">Conversões</th>
            <th className="px-4 py-3 text-right">Reprovados</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((point) => {
            const canExpand = point.scansPorAcademia.length > 1
            const isExpanded = canExpand && expandedDate === point.date
            return (
              <Fragment key={point.date}>
                <tr className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{formatDate(point.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{point.totalAlunos}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                    {canExpand ? (
                      <button
                        type="button"
                        onClick={() => setExpandedDate(isExpanded ? null : point.date)}
                        title="Ver scans por academia"
                        aria-expanded={isExpanded}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold transition ${
                          isExpanded
                            ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400'
                            : 'text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-800'
                        }`}
                      >
                        {point.totalScans}
                        <ChevronIcon open={isExpanded} />
                      </button>
                    ) : (
                      point.totalScans
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{point.contatos}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{point.conversoes}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{point.reprovados}</td>
                </tr>
                {isExpanded && <ScansPorAcademiaRow point={point} />}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
