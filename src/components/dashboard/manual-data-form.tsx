'use client'

import { useEffect, useState, useTransition } from 'react'
import { saveManualData } from '@/app/(app)/performance/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'
import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ManualDataForm({
  academias,
  fixedAcademiaId,
  history,
  editing = null,
  onCancelEdit,
  onSave = saveManualData,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  history: ManualDataEntry[]
  editing?: ManualDataEntry | null
  onCancelEdit?: () => void
  onSave?: (formData: FormData) => Promise<void>
}) {
  const [academiaId, setAcademiaId] = useState(editing?.academiaId ?? fixedAcademiaId ?? academias[0]?.id ?? '')
  const [data, setData] = useState(editing?.data ?? todayIso())
  const [totalScans, setTotalScans] = useState('')
  const [contatosAjuste, setContatosAjuste] = useState('')
  const [conversoesAjuste, setConversoesAjuste] = useState('')
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  // manual_data tem unique (academia_id, data) — é a chave certa pra saber se essa
  // combinação já tem lançamento.
  const existing = history.find((h) => h.academiaId === academiaId && h.data === data) ?? null

  // Sempre que a academia ou a data mudam — seja o usuário trocando no formulário,
  // seja o clique em "Editar" no histórico (que só ajusta academiaId/data abaixo) —
  // preenche os campos com o que já existe pra essa combinação. Sem isso, trocar de
  // academia sempre mostrava o formulário zerado mesmo quando aquele dia já tinha
  // lançamento, arriscando sobrescrever com zero sem querer.
  useEffect(() => {
    if (existing) {
      setTotalScans(String(existing.totalScans))
      setContatosAjuste(existing.contatosAjuste != null ? String(existing.contatosAjuste) : '')
      setConversoesAjuste(existing.conversoesAjuste != null ? String(existing.conversoesAjuste) : '')
    } else {
      setTotalScans('')
      setContatosAjuste('')
      setConversoesAjuste('')
    }
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
        showToast(existing ? 'Lançamento atualizado.' : 'Dados manuais salvos.')
        onCancelEdit?.()
        setData(todayIso())
        if (!fixedAcademiaId) setAcademiaId(academias[0]?.id ?? '')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar dados manuais.', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
      {existing && (
        <div className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 lg:col-span-5">
          Já existe um lançamento de {existing.academiaNome} em{' '}
          {new Date(`${existing.data}T00:00:00`).toLocaleDateString('pt-BR')} — os campos abaixo foram preenchidos
          com os valores atuais, editar e salvar vai atualizá-los.
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
        <label className="field-label" htmlFor="total_scans">
          Scans QR
        </label>
        <input
          id="total_scans"
          name="total_scans"
          type="number"
          min={0}
          required
          className="input"
          value={totalScans}
          onChange={(e) => setTotalScans(e.target.value)}
        />
      </div>

      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? 'Salvando…' : existing ? 'Atualizar' : 'Salvar'}
        </button>
      </div>

      <div className="lg:col-span-2">
        <label className="field-label" htmlFor="contatos_ajuste">
          Ajuste de contatos (opcional)
        </label>
        <input
          id="contatos_ajuste"
          name="contatos_ajuste"
          type="number"
          min={0}
          placeholder="deixe em branco pra usar a contagem automática"
          className="input"
          value={contatosAjuste}
          onChange={(e) => setContatosAjuste(e.target.value)}
        />
      </div>

      <div className="lg:col-span-2">
        <label className="field-label" htmlFor="conversoes_ajuste">
          Ajuste de conversões (opcional)
        </label>
        <input
          id="conversoes_ajuste"
          name="conversoes_ajuste"
          type="number"
          min={0}
          placeholder="deixe em branco pra usar a contagem automática"
          className="input"
          value={conversoesAjuste}
          onChange={(e) => setConversoesAjuste(e.target.value)}
        />
      </div>

      <p className="text-xs text-slate-400 lg:col-span-5">
        Contatos e conversões normalmente vêm automáticos do agregador — só preencha o ajuste se precisar corrigir o
        número desse dia específico (ele substitui a contagem automática, não soma).
      </p>
    </form>
  )
}
