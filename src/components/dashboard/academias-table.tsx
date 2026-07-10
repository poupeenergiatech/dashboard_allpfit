'use client'

import { useState, useTransition } from 'react'
import { setAcademiaActive } from '@/app/(app)/academias/actions'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import type { AcademiaAdmin } from '@/lib/dashboard/fetch-academias'

type ToggleAction = (academiaId: string, ativo: boolean) => Promise<void>

export function AcademiasTable({
  academias,
  onToggleActive = setAcademiaActive,
}: {
  academias: AcademiaAdmin[]
  onToggleActive?: ToggleAction
}) {
  if (academias.length === 0) {
    return <div className="card-dashed text-sm text-slate-500">Nenhuma academia cadastrada ainda.</div>
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Unidade</th>
            <th className="px-4 py-3">Número WhatsApp</th>
            <th className="px-4 py-3">Ativa</th>
          </tr>
        </thead>
        <tbody>
          {academias.map((a) => (
            <AcademiaRow key={a.id} academia={a} onToggleActive={onToggleActive} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AcademiaRow({
  academia,
  onToggleActive,
}: {
  academia: AcademiaAdmin
  onToggleActive: ToggleAction
}) {
  const [ativo, setAtivo] = useState(academia.ativo)
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function toggle() {
    if (pending) return
    const next = !ativo
    setAtivo(next)
    startTransition(async () => {
      try {
        await onToggleActive(academia.id, next)
        showToast(next ? `${academia.nome} reativada.` : `${academia.nome} desativada.`)
      } catch (err) {
        setAtivo(!next)
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={academia.nome} />
          <span className="text-slate-900">{academia.nome}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{academia.numeroTelefone ?? '—'}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          disabled={pending}
          onClick={toggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
            ativo ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              ativo ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </td>
    </tr>
  )
}
