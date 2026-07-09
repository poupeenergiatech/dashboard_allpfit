'use client'

import { useTransition } from 'react'
import { saveManualData } from '@/app/(app)/performance/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'

export function ManualDataForm({
  academias,
  fixedAcademiaId,
  onSave = saveManualData,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  onSave?: (formData: FormData) => Promise<void>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        await onSave(formData)
        showToast('Dados manuais salvos.')
        form.reset()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar dados manuais.', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <label className="field-label" htmlFor="academia_id">
          Academia
        </label>
        {fixedAcademiaId ? (
          <>
            <input type="hidden" name="academia_id" value={fixedAcademiaId} />
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
              {academias.find((a) => a.id === fixedAcademiaId)?.nome ?? '—'}
            </p>
          </>
        ) : (
          <select id="academia_id" name="academia_id" required className="select">
            {academias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="field-label" htmlFor="data">
          Data
        </label>
        <input id="data" name="data" type="date" defaultValue={today} required className="input" />
      </div>

      <div>
        <label className="field-label" htmlFor="total_alunos">
          Total de alunos
        </label>
        <input id="total_alunos" name="total_alunos" type="number" min={0} required className="input" />
      </div>

      <div>
        <label className="field-label" htmlFor="total_scans">
          Scans QR
        </label>
        <input id="total_scans" name="total_scans" type="number" min={0} required className="input" />
      </div>

      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
