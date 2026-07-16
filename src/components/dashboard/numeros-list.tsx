'use client'

import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import type { NumeroGroup } from '@/lib/dashboard/fetch-numeros'

type StatusFilter = 'todos' | 'online' | 'offline'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

function matchesSearch(group: NumeroGroup, term: string): boolean {
  if (group.numeroTelefone?.toLowerCase().includes(term)) return true
  return group.unidades.some((u) => u.nome.toLowerCase().includes(term))
}

export function NumerosList({ rows }: { rows: NumeroGroup[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((group) => {
      if (status === 'online' && !group.ativo) return false
      if (status === 'offline' && group.ativo) return false
      if (term && !matchesSearch(group, term)) return false
      return true
    })
  }, [rows, search, status])

  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número ou unidade…"
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum número encontrado pra esse filtro.</div>
      ) : (
        filtered.map((group) => (
          <NumeroGroupCard key={group.numeroTelefone ?? group.unidades[0].academiaId} group={group} />
        ))
      )}
    </div>
  )
}

function NumeroGroupCard({ group }: { group: NumeroGroup }) {
  const unidadeCount = group.unidades.length

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums text-slate-900 dark:text-white">
            {group.numeroTelefone ?? 'Número não configurado'}
          </span>
          <span className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300">
            {unidadeCount} {unidadeCount === 1 ? 'unidade' : 'unidades'}
          </span>
          <span
            className={`badge ${group.ativo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
          >
            <span className={`badge-dot ${group.ativo ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
            {group.ativo ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="shrink-0 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{group.mensagensHoje}</span> mensagens hoje
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {group.unidades.map((unidade) => (
          <div
            key={unidade.academiaId}
            className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 py-1.5 pl-1.5 pr-3 transition hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
          >
            <Avatar name={unidade.nome} className="h-6 w-6 text-[10px]" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{unidade.nome}</span>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${unidade.ativo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              title={unidade.ativo ? 'Ativa' : 'Inativa'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
