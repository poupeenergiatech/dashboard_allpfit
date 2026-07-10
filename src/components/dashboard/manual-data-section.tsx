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
  onSave,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  history: ManualDataEntry[]
  onSave?: (formData: FormData) => Promise<void>
}) {
  const [editing, setEditing] = useState<ManualDataEntry | null>(null)

  return (
    <div className="space-y-4">
      <ManualDataForm
        academias={academias}
        fixedAcademiaId={fixedAcademiaId}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        {...(onSave ? { onSave } : {})}
      />

      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Histórico de lançamentos</h4>
        <ManualDataHistoryTable entries={history} onEdit={setEditing} />
      </div>
    </div>
  )
}
