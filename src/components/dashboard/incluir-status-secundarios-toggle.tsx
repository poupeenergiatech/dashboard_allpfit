'use client'

import { useState, useTransition } from 'react'
import { setIncluirStatusSecundariosConversao } from '@/app/(app)/configuracoes/actions'
import { useToast } from '@/components/ui/toast'

type ToggleAction = (enabled: boolean) => Promise<void>

export function IncluirStatusSecundariosToggle({
  initialEnabled,
  onToggle = setIncluirStatusSecundariosConversao,
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
        showToast(next ? 'Status secundários agora contam como conversão.' : 'Status secundários não contam mais como conversão.')
      } catch (err) {
        setEnabled(!next)
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Contar &quot;Sem informação&quot;, &quot;Com impedimentos&quot; e &quot;Falta documentos&quot; como conversão
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Ativo, Pendente e Reprovado sempre contam no total de conversões. Esses três status ficam de fora por
          padrão — ligue aqui se quiser que também entrem na soma.
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
