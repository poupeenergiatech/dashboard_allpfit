'use client'

import { useTransition } from 'react'
import { markAsSigned } from '@/app/(app)/pendentes/actions'
import { useToast } from '@/components/ui/toast'

export function MarkSignedButton({ id, nome }: { id: string; nome: string }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleClick() {
    startTransition(async () => {
      try {
        await markAsSigned(id)
        showToast(`${nome} marcado(a) como assinado.`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao marcar como assinado.', 'error')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="shrink-0 rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
    >
      {pending ? 'Salvando…' : 'Assinou'}
    </button>
  )
}
