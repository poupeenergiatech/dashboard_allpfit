'use client'

import { useState } from 'react'
import { PendenciaForm } from './pendencia-form'
import { PendenciaHistoryTable } from './pendencia-history-table'
import type { Academia } from '@/lib/dashboard/types'
import type { PendenciaEntry } from '@/lib/dashboard/fetch-pendencias-assinatura'

export function PendenciaSection({
  academias,
  fixedAcademiaId,
  history,
  onSave,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  history: PendenciaEntry[]
  onSave?: (formData: FormData) => Promise<void>
}) {
  const [editing, setEditing] = useState<PendenciaEntry | null>(null)

  return (
    <div className="space-y-4">
      <PendenciaForm
        academias={academias}
        fixedAcademiaId={fixedAcademiaId}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        {...(onSave ? { onSave } : {})}
      />

      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Histórico de lançamentos</h4>
        <PendenciaHistoryTable entries={history} onEdit={setEditing} />
      </div>
    </div>
  )
}
