'use client'

import { useState, useTransition } from 'react'
import { setFinanceiroVisivelOutrosCargos } from '@/app/(app)/configuracoes/actions'
import { useToast } from '@/components/ui/toast'

type ToggleAction = (enabled: boolean) => Promise<void>

export function FinanceiroVisibilityToggle({
  initialEnabled,
  onToggle = setFinanceiroVisivelOutrosCargos,
}: {
  initialEnabled: boolean
  onToggle?: ToggleAction
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function toggle() {
    if (pending) return
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        await onToggle(next)
        showToast(next ? 'Financeiro visível pra Direção e Gestor.' : 'Financeiro oculto pra Direção e Gestor.')
      } catch (err) {
        setEnabled(!next)
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">Mostrar Financeiro pra Direção e Gestor</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Super Admin sempre enxerga /financeiro, independente disso. Desligue aqui pra esconder a página (menu e
          acesso direto) de quem tem cargo Direção ou Gestor.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={pending}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          enabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-slate-900 shadow transition-all ${
            enabled ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
