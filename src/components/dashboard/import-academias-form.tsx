'use client'

import { useState, useTransition } from 'react'
import { importAcademiasCsv, type ImportAcademiasResult } from '@/app/(app)/academias/actions'
import { useToast } from '@/components/ui/toast'

export function ImportAcademiasForm({
  onImport = importAcademiasCsv,
}: {
  onImport?: (formData: FormData) => Promise<ImportAcademiasResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportAcademiasResult | null>(null)
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const summary = await onImport(formData)
        setResult(summary)
        showToast(`Importação concluída: ${summary.criadas} criada(s), ${summary.atualizadas} atualizada(s).`)
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
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Colunas obrigatórias: <code className="rounded bg-slate-100 px-1 py-0.5">nome_academia</code>,{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5">numero_whatsapp</code>. Nome já cadastrado tem o
            número atualizado; nome novo vira academia nova.
          </p>
        </div>
        <button type="submit" disabled={pending} className="btn-secondary shrink-0">
          {pending ? 'Importando…' : 'Importar CSV'}
        </button>
      </form>

      {result && (
        <div className="card border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
          {result.criadas} criada(s), {result.atualizadas} atualizada(s)
          {result.ignoradas > 0 ? `, ${result.ignoradas} linha(s) ignorada(s) (sem nome)` : ''}.
        </div>
      )}
    </div>
  )
}
