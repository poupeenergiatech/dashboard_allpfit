'use client'

import { useState, useTransition } from 'react'
import { setTrained } from '@/app/(app)/treinadas/actions'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import type { TreinadaStatus } from '@/lib/dashboard/fetch-treinadas'

type ToggleAction = (academiaId: string, treinada: boolean) => Promise<void>

export function TreinadasGrid({
  rows,
  canEdit,
  onToggle = setTrained,
}: {
  rows: TreinadaStatus[]
  canEdit: boolean
  onToggle?: ToggleAction
}) {
  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <TreinadaCard key={row.academiaId} row={row} canEdit={canEdit} onToggle={onToggle} />
      ))}
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
        <span className="truncate text-sm font-medium text-slate-900">{row.nome}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={treinada}
        disabled={!canEdit || pending}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          treinada ? 'bg-emerald-500' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            treinada ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
