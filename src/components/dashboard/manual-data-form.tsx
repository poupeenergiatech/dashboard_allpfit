'use client'

import { useTransition } from 'react'
import { saveManualData } from '@/app/(app)/performance/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'

export function ManualDataForm({
  academias,
  fixedAcademiaId,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
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
        await saveManualData(formData)
        showToast('Dados manuais salvos.')
        form.reset()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar dados manuais.', 'error')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="lg:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="academia_id">
          Academia
        </label>
        {fixedAcademiaId ? (
          <>
            <input type="hidden" name="academia_id" value={fixedAcademiaId} />
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {academias.find((a) => a.id === fixedAcademiaId)?.nome ?? '—'}
            </p>
          </>
        ) : (
          <select
            id="academia_id"
            name="academia_id"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {academias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="data">
          Data
        </label>
        <input
          id="data"
          name="data"
          type="date"
          defaultValue={today}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="total_alunos">
          Total de alunos
        </label>
        <input
          id="total_alunos"
          name="total_alunos"
          type="number"
          min={0}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="total_scans">
          Scans QR
        </label>
        <input
          id="total_scans"
          name="total_scans"
          type="number"
          min={0}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
