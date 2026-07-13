'use client'

import { useEffect, useState, useTransition } from 'react'
import { savePendenciaAssinatura } from '@/app/(app)/pendentes/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'
import type { PendenciaEntry } from '@/lib/dashboard/fetch-pendencias-assinatura'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PendenciaForm({
  academias,
  fixedAcademiaId,
  history,
  editing = null,
  onCancelEdit,
  onSave = savePendenciaAssinatura,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  history: PendenciaEntry[]
  editing?: PendenciaEntry | null
  onCancelEdit?: () => void
  onSave?: (formData: FormData) => Promise<void>
}) {
  const [academiaId, setAcademiaId] = useState(editing?.academiaId ?? fixedAcademiaId ?? academias[0]?.id ?? '')
  const [data, setData] = useState(editing?.data ?? todayIso())
  const [quantidade, setQuantidade] = useState('0')
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  // pendencias_assinatura tem unique (academia_id, data) — é a chave certa pra
  // saber se essa combinação já tem lançamento.
  const existing = history.find((h) => h.academiaId === academiaId && h.data === data) ?? null

  // Sempre que a academia ou a data mudam — seja o usuário trocando no formulário,
  // seja o clique em "Editar" no histórico (que só ajusta academiaId/data abaixo) —
  // preenche o campo com o que já existe pra essa combinação, em vez de mostrar
  // sempre zero mesmo quando aquele dia já tinha lançamento.
  useEffect(() => {
    setQuantidade(existing ? String(existing.quantidade) : '0')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academiaId, data])

  useEffect(() => {
    if (editing) {
      setAcademiaId(editing.academiaId)
      setData(editing.data)
    }
  }, [editing])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        await onSave(formData)
        showToast(existing ? 'Lançamento atualizado.' : 'Pendência registrada.')
        onCancelEdit?.()
        setData(todayIso())
        if (!fixedAcademiaId) setAcademiaId(academias[0]?.id ?? '')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar pendência.', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {existing && (
        <div className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 lg:col-span-4">
          Já existe um lançamento de {existing.academiaNome} em{' '}
          {new Date(`${existing.data}T00:00:00`).toLocaleDateString('pt-BR')} — o campo abaixo foi preenchido com o
          valor atual, editar e salvar vai atualizá-lo.
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
            value={academiaId}
            onChange={(e) => setAcademiaId(e.target.value)}
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
        <input
          id="data"
          name="data"
          type="date"
          required
          className="input"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
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
          required
          className="input"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? 'Salvando…' : existing ? 'Atualizar' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
