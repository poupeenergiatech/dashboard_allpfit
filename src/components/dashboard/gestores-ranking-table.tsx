'use client'

import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icons'
import { Pagination } from './pagination'
import type { GestoresPanelRow } from '@/lib/dashboard/fetch-gestores-panel'

type SortKey =
  | 'nome'
  | 'totalConversoes'
  | 'totalScansPeriodo'
  | 'totalScansHoje'
  | 'totalContatos'
  | 'totalAlunos'
  | 'clientesAlleAtivos'
  | 'pendentesAssinatura'

type Column = { key: SortKey; label: string; align?: 'right' }

const COLUMNS: Column[] = [
  { key: 'nome', label: 'Academia' },
  { key: 'totalConversoes', label: 'Conversões', align: 'right' },
  { key: 'totalScansPeriodo', label: 'Scans período', align: 'right' },
  { key: 'totalScansHoje', label: 'Scans hoje', align: 'right' },
  { key: 'totalContatos', label: 'Contatos', align: 'right' },
  { key: 'totalAlunos', label: 'Alunos', align: 'right' },
  { key: 'clientesAlleAtivos', label: 'Clientes ativos', align: 'right' },
  { key: 'pendentesAssinatura', label: 'Pendentes assinatura', align: 'right' },
]

const RANK_BADGE = [
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
]

const PAGE_SIZE = 5

// Tabela completa, com todas as unidades (paginada, PAGE_SIZE por página) — clicar
// num cabeçalho reordena por aquela métrica (útil pra "quem está na frente" mudar
// de figura conforme o que importa: total de conversões, scans de hoje, etc.).
// Posição (#1, #2…) reflete a ordenação atual (calculada antes de paginar, não
// reinicia a cada página) — só a coluna Conversões, que já vem ordenada assim do
// servidor (ver fetchGestoresPanel), tem os 3 primeiros com o mesmo destaque de
// medalha do pódio acima.
export function GestoresRankingTable({ rows }: { rows: GestoresPanelRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('totalConversoes')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sortDesc ? -cmp : cmp
    })
    return copy
  }, [rows, sortKey, sortDesc])

  useEffect(() => {
    setPage(1)
  }, [sortKey, sortDesc])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDesc((v) => !v)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  if (rows.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma academia encontrada.</div>
  }

  const isDefaultSort = sortKey === 'totalConversoes' && sortDesc
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageStart = (page - 1) * PAGE_SIZE
  const pageRows = sorted.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">#</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className={col.align === 'right' ? 'px-4 py-3 text-right' : 'px-4 py-3'}>
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className={`inline-flex items-center gap-1 transition hover:text-slate-700 dark:hover:text-slate-300 ${
                    col.align === 'right' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <Icon
                      name="trend"
                      strokeWidth={2.5}
                      className={`h-3 w-3 transition-transform ${sortDesc ? 'rotate-90' : '-rotate-90'}`}
                    />
                  )}
                </button>
              </th>
            ))}
            <th className="px-4 py-3">Treinada</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => {
            const rank = pageStart + i
            return (
            <tr
              key={row.academiaId}
              className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
            >
              <td className="px-4 py-3">
                {isDefaultSort && rank < 3 ? (
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${RANK_BADGE[rank]}`}
                  >
                    {rank + 1}
                  </span>
                ) : (
                  <span className="pl-1.5 text-slate-400 dark:text-slate-500">{rank + 1}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={row.nome} />
                  <span className="font-medium text-slate-900 dark:text-white">{row.nome}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                {row.totalConversoes.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {row.totalScansPeriodo.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {row.totalScansHoje.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {row.totalContatos.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {row.totalAlunos.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {row.clientesAlleAtivos.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                {row.pendentesAssinatura.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3">
                {row.treinada ? (
                  <span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    Sim
                  </span>
                ) : (
                  <span className="badge bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400">
                    Não
                  </span>
                )}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
