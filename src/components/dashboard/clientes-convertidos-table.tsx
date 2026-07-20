'use client'

import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { Pagination } from './pagination'
import type { ClienteConvertido } from '@/lib/dashboard/fetch-clientes-convertidos'

type StatusFilter = 'todos' | 'sem_unidade'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'sem_unidade', label: 'Sem unidade' },
]

const PAGE_SIZE = 15

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function ClientesConvertidosTable({ clientes }: { clientes: ClienteConvertido[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return clientes.filter((c) => {
      if (status === 'sem_unidade' && c.academiaId !== null) return false
      if (term && !(c.nome ?? '').toLowerCase().includes(term)) return false
      return true
    })
  }, [clientes, search, status])

  useEffect(() => {
    setPage(1)
  }, [search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const semUnidadeCount = clientes.filter((c) => c.academiaId === null).length

  if (clientes.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente convertido ainda.</div>
  }

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome…"
        statusOptions={semUnidadeCount > 0 ? STATUS_OPTIONS : []}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente encontrado pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Academia</th>
                <th className="px-4 py-3">Convertido em</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                  <td className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.nome ?? '?'} />
                      <span className="text-slate-900 dark:text-white">{c.nome ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.academiaNome ? (
                      <span className="text-slate-600 dark:text-slate-300">{c.academiaNome}</span>
                    ) : (
                      <span
                        className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        title="unidade_allpfit em branco no Alle Documentos — corrija na origem pra vincular."
                      >
                        Sem unidade
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
