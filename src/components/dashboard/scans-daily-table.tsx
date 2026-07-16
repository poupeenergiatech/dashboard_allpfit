'use client'

import { Fragment, useState } from 'react'
import { Pagination } from './pagination'
import { ScansBreakdownTable } from './scans-breakdown-table'
import { Icon } from '@/components/ui/icons'
import type { ScansDailyPoint } from '@/lib/dashboard/fetch-scans'

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

// Mesmo padrão de expandir por clique de funnel-daily-history-table.tsx, só que
// dedicado a scans (sem alunos/contatos/conversões misturados) — histórico completo
// do período, paginado (15/página) porque "1 ano" enumera até 365 linhas.
export function ScansDailyTable({ series }: { series: ScansDailyPoint[] }) {
  const [page, setPage] = useState(1)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  if (series.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum scan no período selecionado.</div>
  }

  const rows = [...series].reverse()
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasBreakdown = rows.some((r) => r.porAcademia.length > 1)

  return (
    <div className="card overflow-x-auto">
      {hasBreakdown && (
        <p className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
          Clique no total de um dia pra ver o detalhe por academia.
        </p>
      )}
      <table className="w-full min-w-[360px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Scans</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((point) => {
            const canExpand = point.porAcademia.length > 1
            const isExpanded = canExpand && expandedDate === point.date
            return (
              <Fragment key={point.date}>
                <tr className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{formatDate(point.date)}</td>
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
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={2} className="p-0">
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 px-4 py-4">
                        <ScansBreakdownTable rows={point.porAcademia} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
