'use client'

import { useTransition } from 'react'
import { savePendenciaAssinatura } from '@/app/(app)/pendentes/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'
import type { PendenciaEntry } from '@/lib/dashboard/fetch-pendencias-assinatura'

export function PendenciaForm({
  academias,
  fixedAcademiaId,
  editing = null,
  onCancelEdit,
  onSave = savePendenciaAssinatura,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  editing?: PendenciaEntry | null
  onCancelEdit?: () => void
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
        showToast(editing ? 'Lançamento atualizado.' : 'Pendência registrada.')
        form.reset()
        onCancelEdit?.()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar pendência.', 'error')
      }
    })
  }

  return (
    // key força remontar o form com os defaultValue certos ao trocar entre "novo
    // lançamento" e "editar um dia do histórico" (inputs não controlados).
    <form
      key={editing?.id ?? 'new'}
      onSubmit={handleSubmit}
      className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {editing && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 lg:col-span-4">
          Editando lançamento de {editing.academiaNome} em{' '}
          {new Date(`${editing.data}T00:00:00`).toLocaleDateString('pt-BR')}
          <button type="button" onClick={onCancelEdit} className="font-semibold underline underline-offset-2">
            Cancelar
          </button>
        </div>
      )}

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
          <select
            id="academia_id"
            name="academia_id"
            required
            className="select"
            defaultValue={editing?.academiaId}
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
        <label className="field-label" htmlFor="data">
          Data
        </label>
        <input id="data" name="data" type="date" defaultValue={editing?.data ?? today} required className="input" />
      </div>

      <div>
        <label className="field-label" htmlFor="quantidade">
          Alunos pendentes
        </label>
        <input
          id="quantidade"
          name="quantidade"
          type="number"
          min={0}
          defaultValue={editing?.quantidade ?? 0}
          required
          className="input"
        />
      </div>

      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? 'Salvando…' : editing ? 'Atualizar' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
