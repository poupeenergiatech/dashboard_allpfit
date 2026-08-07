'use client'

import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icons'
import type { NumeroGroup } from '@/lib/dashboard/fetch-numeros'

type StatusFilter = 'todos' | 'online' | 'offline'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

// Linha da tabela: um grupo por número real (ver fetch-numeros.ts), mais no
// máximo UMA linha sintética consolidando toda unidade sem número configurado
// (rows já traz cada uma dessas como grupo de 1, separado — ver comentário na
// query). Uma linha só de "sem número" fica mais legível na tabela nova do
// que uma por unidade, e é isso que vira "Pendente" no design.
type DisplayGroup = {
  key: string
  numeroTelefone: string | null
  ativo: boolean
  mensagensHoje: number
  unidades: NumeroGroup['unidades']
}

const SEM_NUMERO_KEY = 'sem-numero'

function unidadesResumo(unidades: DisplayGroup['unidades']): string {
  if (unidades.length === 0) return '—'
  if (unidades.length === 1) return unidades[0].nome
  return `${unidades[0].nome} +${unidades.length - 1}`
}

export function NumerosList({ rows }: { rows: NumeroGroup[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Agrupa toda unidade sem número num único DisplayGroup — o resto some 1:1
  // pro shape que já vem de fetchNumeros.
  const { comNumero, semNumero } = useMemo(() => {
    const comNumero: DisplayGroup[] = []
    let unidadesSemNumero: NumeroGroup['unidades'] = []
    let contatosSemNumero = 0

    for (const group of rows) {
      if (group.numeroTelefone) {
        comNumero.push({ ...group, key: group.numeroTelefone })
      } else {
        unidadesSemNumero = unidadesSemNumero.concat(group.unidades)
        contatosSemNumero += group.mensagensHoje
      }
    }

    const semNumero: DisplayGroup | null =
      unidadesSemNumero.length > 0
        ? {
            key: SEM_NUMERO_KEY,
            numeroTelefone: null,
            ativo: false,
            mensagensHoje: contatosSemNumero,
            unidades: unidadesSemNumero,
          }
        : null

    return { comNumero, semNumero }
  }, [rows])

  const allGroups = useMemo(
    () => (semNumero ? [...comNumero, semNumero] : comNumero),
    [comNumero, semNumero]
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allGroups.filter((group) => {
      const online = !!group.numeroTelefone && group.ativo
      if (status === 'online' && !online) return false
      if (status === 'offline' && online) return false
      if (term) {
        const matchesNumero = group.numeroTelefone?.toLowerCase().includes(term) ?? false
        const matchesUnidade = group.unidades.some((u) => u.nome.toLowerCase().includes(term))
        if (!matchesNumero && !matchesUnidade) return false
      }
      return true
    })
  }, [allGroups, search, status])

  const selectedGroup = useMemo(
    () => allGroups.find((g) => g.key === selectedKey) ?? null,
    [allGroups, selectedKey]
  )

  function toggleSelect(key: string) {
    setSelectedKey((prev) => (prev === key ? null : key))
  }

  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  const totalOnline = comNumero.filter((g) => g.ativo).length
  const totalOffline = comNumero.length - totalOnline
  const totalContatosHoje = rows.reduce((sum, g) => sum + g.mensagensHoje, 0)
  const semNumeroCount = semNumero?.unidades.length ?? 0

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      <div className="min-w-0 space-y-4 lg:flex-1">
        <SummaryLine
          configurados={comNumero.length}
          online={totalOnline}
          offline={totalOffline}
          contatosHoje={totalContatosHoje}
          semNumero={semNumeroCount}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-600"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número ou unidade…"
              aria-label="Buscar por número ou unidade"
              className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </div>

          <div className="inline-flex items-center gap-1 self-start rounded-md bg-zinc-100 p-1 dark:bg-zinc-900">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                aria-pressed={status === tab.value}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  status === tab.value
                    ? 'bg-white text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <NumerosTable groups={filtered} selectedKey={selectedKey} onSelect={toggleSelect} />
      </div>

      <div className="mt-4 lg:sticky lg:top-8 lg:mt-0 lg:w-80 lg:shrink-0">
        <NumeroDrawer group={selectedGroup} search={search} onClose={() => setSelectedKey(null)} />
      </div>
    </div>
  )
}

function SummaryLine({
  configurados,
  online,
  offline,
  contatosHoje,
  semNumero,
}: {
  configurados: number
  online: number
  offline: number
  contatosHoje: number
  semNumero: number
}) {
  const stats: { value: number; label: string; accent?: string }[] = [
    { value: configurados, label: 'números configurados' },
    { value: online, label: 'online', accent: 'text-emerald-600 dark:text-emerald-400' },
    { value: offline, label: 'offline' },
    { value: contatosHoje, label: 'contatos hoje' },
    { value: semNumero, label: 'sem número', accent: semNumero > 0 ? 'text-amber-600 dark:text-amber-400' : undefined },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
      {stats.map((stat, index) => (
        <span key={stat.label} className="flex items-center gap-2">
          {index > 0 && <span className="text-zinc-300 dark:text-zinc-700">·</span>}
          <span>
            <span className={`font-semibold tabular-nums ${stat.accent ?? 'text-zinc-950 dark:text-zinc-50'}`}>
              {stat.value}
            </span>{' '}
            <span className="text-zinc-500 dark:text-zinc-400">{stat.label}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

function NumerosTable({
  groups,
  selectedKey,
  onSelect,
}: {
  groups: DisplayGroup[]
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
            <th className="px-4 py-2.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Número</th>
            <th className="px-4 py-2.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Unidades</th>
            <th className="px-4 py-2.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Status</th>
            <th className="px-4 py-2.5 text-right text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
              Contatos hoje
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {groups.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum número encontrado pra esse filtro.
              </td>
            </tr>
          ) : (
            groups.map((group) => {
              const configurado = !!group.numeroTelefone
              const selected = group.key === selectedKey

              return (
                <tr
                  key={group.key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={() => onSelect(group.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(group.key)
                    }
                  }}
                  className={`cursor-pointer transition ${
                    selected
                      ? 'bg-zinc-100 dark:bg-zinc-900'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <td className="px-4 py-[11px]">
                    {configurado ? (
                      <span className="font-medium tabular-nums text-zinc-950 dark:text-zinc-50">
                        {group.numeroTelefone}
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="max-w-[280px] px-4 py-[11px] text-zinc-600 dark:text-zinc-400" title={group.unidades.map((u) => u.nome).join(', ')}>
                    {configurado ? (
                      <span className="truncate">{unidadesResumo(group.unidades)}</span>
                    ) : (
                      <span>
                        {group.unidades.length} {group.unidades.length === 1 ? 'unidade' : 'unidades'} sem número
                        vinculado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-[11px]">
                    <StatusBadge configurado={configurado} ativo={group.ativo} />
                  </td>
                  <td className="px-4 py-[11px] text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {group.mensagensHoje}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ configurado, ativo }: { configurado: boolean; ativo: boolean }) {
  if (!configurado) {
    return (
      <span className="badge border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
        <span className="badge-dot bg-amber-500" />
        Pendente
      </span>
    )
  }
  if (ativo) {
    return (
      <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
        <span className="badge-dot bg-emerald-500" />
        Online
      </span>
    )
  }
  return (
    <span className="badge border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
      <span className="badge-dot bg-zinc-400 dark:bg-zinc-500" />
      Offline
    </span>
  )
}

function NumeroDrawer({
  group,
  search,
  onClose,
}: {
  group: DisplayGroup | null
  search: string
  onClose: () => void
}) {
  if (!group) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-zinc-800 dark:bg-zinc-950">
        <Icon name="chat" className="mx-auto h-7 w-7 text-zinc-300 dark:text-zinc-700" />
        <p className="mt-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">Nenhum número selecionado</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Clique numa linha da lista pra ver as unidades vinculadas.
        </p>
      </div>
    )
  }

  const configurado = !!group.numeroTelefone

  // Se a busca bate com uma unidade específica (e não com o próprio número), a
  // lista do drawer também restringe pra essa unidade — mesmo espírito do
  // filtro da tabela, só que dentro do grupo selecionado.
  const term = search.trim().toLowerCase()
  const numeroBateComBusca = configurado && (group.numeroTelefone?.toLowerCase().includes(term) ?? false)
  const unidadesExibidas =
    term.length > 0 && !numeroBateComBusca
      ? group.unidades.filter((u) => u.nome.toLowerCase().includes(term))
      : group.unidades

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {configurado ? group.numeroTelefone : 'Sem número vinculado'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {group.mensagensHoje} {group.mensagensHoje === 1 ? 'contato hoje' : 'contatos hoje'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge configurado={configurado} ativo={group.ativo} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="mb-3 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          {group.unidades.length} {group.unidades.length === 1 ? 'unidade vinculada' : 'unidades vinculadas'}
        </p>

        {unidadesExibidas.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma unidade bate com essa busca.</p>
        ) : (
          <ul className="space-y-1">
            {unidadesExibidas.map((unidade) => (
              <li
                key={unidade.academiaId}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={unidade.nome} className="h-7 w-7 shrink-0 text-[11px]" />
                  <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">{unidade.nome}</span>
                </span>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${unidade.ativo ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                  title={unidade.ativo ? 'Ativa' : 'Inativa'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
