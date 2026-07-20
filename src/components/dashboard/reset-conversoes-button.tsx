'use client'

import { useState, useTransition } from 'react'
import { resetAllConversoes, type ResetConversoesResult } from '@/app/(app)/configuracoes/actions'
import { useToast } from '@/components/ui/toast'

export function ResetConversoesButton({
  onReset = resetAllConversoes,
}: {
  onReset?: () => Promise<ResetConversoesResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ResetConversoesResult | null>(null)
  const { showToast } = useToast()

  function handleClick() {
    if (pending) return
    if (
      !window.confirm(
        'Resetar TODAS as conversões (Ane + Manual) de todas as academias? Apaga os registros automáticos da Ane e zera os lançamentos manuais/Bitrix — não pode ser desfeito.'
      )
    ) {
      return
    }

    startTransition(async () => {
      try {
        const next = await onReset()
        setResult(next)
        showToast('Conversões resetadas.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao resetar conversões.', 'error')
      }
    })
  }

  return (
    <div className="card space-y-4 border border-red-100 dark:border-red-500/20 p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Resetar todas as conversões</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Apaga os registros de conversões automáticas (Ane) e zera todos os lançamentos manuais/Bitrix, em todas as
          academias — o &quot;Total de clientes convertidos&quot; volta a 0 em todo o app. Ação destrutiva e
          irreversível, use só se precisar zerar o histórico pra recomeçar a contagem. A Ane pode voltar a aparecer
          na próxima sincronização, já que a fonte continua existindo no Supabase; os lançamentos manuais, não.
        </p>
      </div>

      <button type="button" onClick={handleClick} disabled={pending} className="btn-danger">
        {pending ? 'Resetando…' : 'Resetar todas as conversões'}
      </button>

      {result && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">{result.conversoesAneRemovidas}</span>{' '}
          conversão(ões) Ane removida(s), <span className="font-semibold text-slate-900 dark:text-white">{result.diasManuaisZerados}</span>{' '}
          lançamento(s) manual(is) zerado(s) e <span className="font-semibold text-slate-900 dark:text-white">{result.academiasZeradas}</span>{' '}
          academia(s) com ajuste histórico zerado.
        </div>
      )}
    </div>
  )
}
