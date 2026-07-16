'use client'

import { Fragment, useState } from 'react'
import { Pagination } from './pagination'
import type { DailyFunnelPoint } from '@/lib/dashboard/types'

const PAGE_SIZE = 15

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

// Detalhe por academia daquele dia — só faz sentido expandir quando o filtro é
// "todas" (mais de uma academia no escopo); com uma só, a coluna Scans já é o
// detalhe. Mostra toda academia no escopo, inclusive as com 0 naquele dia: é
// isso que dá transparência sobre quem não reportou, não só quem reportou.
function ScansPorAcademiaRow({ point }: { point: DailyFunnelPoint }) {
  const rows = [...point.scansPorAcademia].sort((a, b) => b.totalScans - a.totalScans)

  return (
    <tr>
      <td colSpan={5} className="p-0">
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4">
          <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
            <table className="w-full min-w-[320px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2">Academia</th>
                  <th className="px-3 py-2 text-right">Scans</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.academiaId} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2 text-slate-700">{r.academiaNome}</td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        r.totalScans > 0 ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      {r.totalScans}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    return <div className="card-dashed text-sm text-slate-500">Nenhum dado no período selecionado.</div>
  }

  const rows = [...series].reverse()
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Alunos</th>
            <th className="px-4 py-3 text-right">Scans</th>
            <th className="px-4 py-3 text-right">Contatos</th>
            <th className="px-4 py-3 text-right">Conversões</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((point) => {
            const canExpand = point.scansPorAcademia.length > 1
            const isExpanded = canExpand && expandedDate === point.date
            return (
              <Fragment key={point.date}>
                <tr className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium text-slate-900">{formatDate(point.date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.totalAlunos}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {canExpand ? (
                      <button
                        type="button"
                        onClick={() => setExpandedDate(isExpanded ? null : point.date)}
                        className="font-semibold text-brand-700 underline decoration-dotted underline-offset-2 hover:text-brand-800"
                        title="Ver scans por academia"
                      >
                        {point.totalScans}
                      </button>
                    ) : (
                      point.totalScans
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.contatos}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.conversoes}</td>
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
