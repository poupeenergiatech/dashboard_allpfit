'use client'

import { useTransition } from 'react'
import { markAsSigned } from '@/app/(app)/pendentes/actions'
import { useToast } from '@/components/ui/toast'

export function MarkSignedButton({
  id,
  nome,
  onConfirm = markAsSigned,
  onSuccess,
}: {
  id: string
  nome: string
  onConfirm?: (id: string) => Promise<void>
  onSuccess?: () => void
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleClick() {
    startTransition(async () => {
      try {
        await onConfirm(id)
        showToast(`${nome} marcado(a) como assinado.`)
        onSuccess?.()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao marcar como assinado.', 'error')
      }
    })
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className="btn-outline-success btn-sm shrink-0">
      {pending ? (
        'Salvando…'
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Assinou
        </>
      )}
    </button>
  )
}
