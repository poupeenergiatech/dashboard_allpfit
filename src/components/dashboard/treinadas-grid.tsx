'use client'

import { useMemo, useState, useTransition } from 'react'
import { setTrained } from '@/app/(app)/treinadas/actions'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { useToast } from '@/components/ui/toast'
import type { TreinadaStatus } from '@/lib/dashboard/fetch-treinadas'

type ToggleAction = (academiaId: string, treinada: boolean) => Promise<void>
type StatusFilter = 'todas' | 'treinadas' | 'pendentes'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'treinadas', label: 'Treinadas' },
  { value: 'pendentes', label: 'Pendentes' },
]

export function TreinadasGrid({
  rows,
  canEdit,
  onToggle = setTrained,
}: {
  rows: TreinadaStatus[]
  canEdit: boolean
  onToggle?: ToggleAction
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todas')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status === 'treinadas' && !row.treinada) return false
      if (status === 'pendentes' && row.treinada) return false
      if (term && !row.nome.toLowerCase().includes(term)) return false
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
        searchPlaceholder="Buscar por nome…"
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma academia encontrada pra esse filtro.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <TreinadaCard key={row.academiaId} row={row} canEdit={canEdit} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function TreinadaCard({
  row,
  canEdit,
  onToggle,
}: {
  row: TreinadaStatus
  canEdit: boolean
  onToggle: ToggleAction
}) {
  const [treinada, setTreinadaState] = useState(row.treinada)
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function toggle() {
    if (!canEdit || pending) return
    const next = !treinada
    setTreinadaState(next)
    startTransition(async () => {
      try {
        await onToggle(row.academiaId, next)
        showToast(next ? `${row.nome} marcada como treinada.` : `${row.nome} desmarcada.`)
      } catch (err) {
        // Reverte se a Server Action falhar (ex.: bloqueado pela RLS).
        setTreinadaState(!next)
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error')
      }
    })
  }

  return (
    <div className="card-interactive flex items-center justify-between p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={row.nome} />
        <span className="truncate text-sm font-medium text-slate-900 dark:text-white">{row.nome}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={treinada}
        disabled={!canEdit || pending}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          treinada ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-slate-900 shadow transition-all ${
            treinada ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
