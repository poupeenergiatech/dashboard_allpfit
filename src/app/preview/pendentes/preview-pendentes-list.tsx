'use client'

import { useState } from 'react'
import { PendentesList } from '@/components/dashboard/pendentes-list'
import { mockConfirm } from '@/lib/preview/mock-actions'
import type { PendingSignature } from '@/lib/dashboard/fetch-pendentes'

export function PreviewPendentesList({ initialRows }: { initialRows: PendingSignature[] }) {
  const [rows, setRows] = useState(initialRows)

  return (
    <PendentesList
      rows={rows}
      canEdit
      onConfirm={mockConfirm}
      onMarked={(id) => setRows((prev) => prev.filter((r) => r.id !== id))}
    />
  )
}
