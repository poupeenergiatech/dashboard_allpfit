'use client'

import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
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

// Resumo do total (sem aplicar o filtro de busca/status) — a mesma lógica de
// semUnidadeCount em clientes-convertidos-table: o card de topo é sempre "quantos no
// total", não "quantos depois do filtro", pra servir de referência fixa enquanto o
// usuário filtra a lista abaixo.
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

  const totalOnline = rows.filter((g) => g.ativo).length
  const totalOffline = rows.length - totalOnline
  const totalContatosHoje = rows.reduce((sum, g) => sum + g.mensagensHoje, 0)
  const naoConfigurados = rows.filter((g) => !g.numeroTelefone).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FunnelCard label="Números configurados" value={rows.length} icon={<Icon name="chat" className="h-[18px] w-[18px]" />} accent="blue" />
        <FunnelCard label="Online" value={totalOnline} icon={<Icon name="trend" className="h-[18px] w-[18px]" />} accent="emerald" />
        <FunnelCard label="Offline" value={totalOffline} icon={<Icon name="x-circle" className="h-[18px] w-[18px]" />} accent="amber" />
        <FunnelCard label="Contatos hoje" value={totalContatosHoje} icon={<Icon name="users" className="h-[18px] w-[18px]" />} accent="accent" />
      </div>

      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número ou unidade…"
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={setStatus}
      />

      {naoConfigurados > 0 && status === 'todos' && !search && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {naoConfigurados} {naoConfigurados === 1 ? 'unidade' : 'unidades'}
          </span>{' '}
          ainda sem número de WhatsApp configurado.
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum número encontrado pra esse filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => (
            <NumeroGroupCard key={group.numeroTelefone ?? group.unidades[0].academiaId} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}

function NumeroGroupCard({ group }: { group: NumeroGroup }) {
  const unidadeCount = group.unidades.length
  const configurado = !!group.numeroTelefone

  return (
    <div
      className={`card border-l-4 p-4 sm:p-5 ${
        !configurado
          ? 'border-l-amber-400 dark:border-l-amber-500'
          : group.ativo
            ? 'border-l-emerald-400 dark:border-l-emerald-500'
            : 'border-l-slate-200 dark:border-l-slate-700'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {configurado ? (
            <span className="font-medium tabular-nums text-slate-900 dark:text-white">{group.numeroTelefone}</span>
          ) : (
            <span
              className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
              title="Nenhuma dessas unidades tem numero_telefone cadastrado — configure na Academia pra vincular o agregador."
            >
              Número não configurado
            </span>
          )}
          <span className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300">
            {unidadeCount} {unidadeCount === 1 ? 'unidade' : 'unidades'}
          </span>
          {configurado && (
            <span
              className={`badge ${group.ativo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
            >
              <span className={`badge-dot ${group.ativo ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
              {group.ativo ? 'Online' : 'Offline'}
            </span>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{group.mensagensHoje}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">contatos hoje</p>
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
