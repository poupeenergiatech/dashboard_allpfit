'use client'

import { useEffect, useMemo, useState } from 'react'
import { ListFilterBar } from './list-filter-bar'
import { Pagination } from './pagination'
import type { LoginAuditLogEntry } from '@/lib/dashboard/fetch-login-audit-log'

const PAGE_SIZE = 15

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
}

type StatusFilter = 'todos' | 'sucesso' | 'erro'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'erro', label: 'Erro' },
]

export function LoginAuditLogTable({ entries }: { entries: LoginAuditLogEntry[] }) {
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (status !== 'todos' && entry.status !== status) return false
      if (term && !entry.email.toLowerCase().includes(term)) return false
      return true
    })
  }, [entries, status, search])

  useEffect(() => {
    setPage(1)
  }, [status, search])

  if (entries.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma tentativa de login registrada ainda.</div>
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por email"
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma tentativa encontrada pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">User agent</th>
              </tr>
            </thead>
            <tbody>
              {pageEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-50 dark:border-slate-800/60 align-top transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                >
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{entry.email}</td>
                  <td className="px-4 py-3">
                    {entry.status === 'sucesso' ? (
                      <span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Sucesso</span>
                    ) : (
                      <span className="badge bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">Erro</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300">
                    {entry.ipAddress ?? '—'}
                  </td>
                  <td className="px-4 py-3 max-w-[320px] truncate text-xs text-slate-500 dark:text-slate-400" title={entry.userAgent ?? undefined}>
                    {entry.userAgent ?? '—'}
                  </td>
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
