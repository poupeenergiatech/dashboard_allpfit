'use client'

import { useState, useTransition } from 'react'
import { resetPendencias, type ResetPendenciasResult } from '@/app/(app)/pendentes/actions'
import { useToast } from '@/components/ui/toast'

export function ResetPendenciasButton({
  onReset = resetPendencias,
}: {
  onReset?: () => Promise<ResetPendenciasResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ResetPendenciasResult | null>(null)
  const { showToast } = useToast()

  function handleClick() {
    if (pending) return
    if (
      !window.confirm(
        'Zerar o lançamento manual de pendências de todas as academias? Não pode ser desfeito. Não afeta os clientes com status "Pendente" em /clientes-alle.'
      )
    ) {
      return
    }

    startTransition(async () => {
      try {
        const next = await onReset()
        setResult(next)
        showToast('Pendências manuais resetadas.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao resetar pendências.', 'error')
      }
    })
  }

  return (
    <div className="card space-y-4 border border-red-100 dark:border-red-500/20 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Resetar pendências</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Zera o lançamento manual de pendências (o número solto por academia/dia) em todas as academias. O outro
          pedaço da contagem — clientes com status &quot;Pendente&quot; em /clientes-alle — não é afetado, continua
          contando normalmente. Ação destrutiva e irreversível.
        </p>
      </div>

      <button type="button" onClick={handleClick} disabled={pending} className="btn-danger">
        {pending ? 'Resetando…' : 'Resetar pendências'}
      </button>

      {result && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{result.lancamentosZerados}</span>{' '}
          lançamento(s) manual(is) zerado(s).
        </div>
      )}
    </div>
  )
}
