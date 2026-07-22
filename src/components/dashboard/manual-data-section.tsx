'use client'

import { useState } from 'react'
import { ManualDataForm } from './manual-data-form'
import { ManualDataHistoryTable } from './manual-data-history-table'
import type { Academia } from '@/lib/dashboard/types'
import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'

export function ManualDataSection({
  academias,
  fixedAcademiaId,
  history,
  editable = true,
  onSave,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  history: ManualDataEntry[]
  editable?: boolean
  onSave?: (formData: FormData) => Promise<void>
}) {
  const [editing, setEditing] = useState<ManualDataEntry | null>(null)

  return (
    <div className="space-y-4">
      {editable && (
        <ManualDataForm
          academias={academias}
          fixedAcademiaId={fixedAcademiaId}
          history={history}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          {...(onSave ? { onSave } : {})}
        />
      )}

      <div>
        <h4 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Histórico de lançamentos</h4>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Cada lançamento manual por academia e dia: scans registrados fora do QR automático, reprovados,
          ajustes de contatos e conversões fechadas fora da Ane.
        </p>
        <ManualDataHistoryTable entries={history} {...(editable ? { onEdit: setEditing } : {})} />
      </div>
    </div>
  )
}
