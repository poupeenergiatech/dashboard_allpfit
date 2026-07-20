'use client'

import { useState, useTransition } from 'react'
import { importClientesAlleCsv, type ImportClientesAlleResult } from '@/app/(app)/clientes-alle/actions'
import { useToast } from '@/components/ui/toast'

export function ClientesAlleImportForm({
  onImport = importClientesAlleCsv,
}: {
  onImport?: (formData: FormData) => Promise<ImportClientesAlleResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportClientesAlleResult | null>(null)
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const summary = await onImport(formData)
        setResult(summary)
        showToast(`Importação concluída: ${summary.importados} novo(s), ${summary.atualizados} atualizado(s).`)
        form.reset()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao importar CSV.', 'error')
      }
    })
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="field-label" htmlFor="csv">
            Arquivo CSV
          </label>
          <input
            id="csv"
            name="csv"
            type="file"
            accept=".csv,text/csv"
            required
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 dark:file:text-slate-300"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Colunas obrigatórias: <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">nome</code>,{' '}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">academia</code>. Opcionais:{' '}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">status</code> (&quot;ativo&quot; ou
            &quot;pendente&quot; — em branco vira pendente),{' '}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">telefone</code>,{' '}
            <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">email</code>. Mesmo nome na mesma
            academia atualiza o cadastro em vez de duplicar.
          </p>
        </div>
        <button type="submit" disabled={pending} className="btn-secondary shrink-0">
          {pending ? 'Importando…' : 'Importar CSV'}
        </button>
      </form>

      {result && (
        <div className="card border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-300">
          <p>
            {result.importados} novo(s), {result.atualizados} atualizado(s)
            {result.ignorados > 0 ? `, ${result.ignorados} linha(s) ignorada(s)` : ''}.
          </p>
          {result.academiasNaoEncontradas.length > 0 && (
            <p className="mt-1.5 text-amber-700 dark:text-amber-400">
              Academia não encontrada: {result.academiasNaoEncontradas.join(', ')} — confira o nome ou cadastre um
              alias em /academias.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
