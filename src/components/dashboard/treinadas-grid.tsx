'use client'

import { useState, useTransition } from 'react'
import { setTrained } from '@/app/(app)/treinadas/actions'
import { useToast } from '@/components/ui/toast'
import type { TreinadaStatus } from '@/lib/dashboard/fetch-treinadas'

export function TreinadasGrid({ rows, canEdit }: { rows: TreinadaStatus[]; canEdit: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <TreinadaCard key={row.academiaId} row={row} canEdit={canEdit} />
      ))}
    </div>
  )
}

function TreinadaCard({ row, canEdit }: { row: TreinadaStatus; canEdit: boolean }) {
  const [treinada, setTreinadaState] = useState(row.treinada)
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function toggle() {
    if (!canEdit || pending) return
    const next = !treinada
    setTreinadaState(next)
    startTransition(async () => {
      try {
        await setTrained(row.academiaId, next)
        showToast(next ? `${row.nome} marcada como treinada.` : `${row.nome} desmarcada.`)
      } catch (err) {
        // Reverte se a Server Action falhar (ex.: bloqueado pela RLS).
        setTreinadaState(!next)
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error')
      }
    })
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
      <span className="text-sm font-medium text-slate-900">{row.nome}</span>
      <button
        type="button"
        role="switch"
        aria-checked={treinada}
        disabled={!canEdit || pending}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          treinada ? 'bg-emerald-500' : 'bg-slate-300'
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
