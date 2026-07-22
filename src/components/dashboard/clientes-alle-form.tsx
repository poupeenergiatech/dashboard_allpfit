'use client'

import { useState, useTransition } from 'react'
import { createClienteAlle } from '@/app/(app)/clientes-alle/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'

export function ClientesAlleForm({
  academias,
  fixedAcademiaId,
  onCreate = createClienteAlle,
}: {
  academias: Academia[]
  fixedAcademiaId: string | null
  onCreate?: (formData: FormData) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()
  const [academiaId, setAcademiaId] = useState(fixedAcademiaId ?? academias[0]?.id ?? '')
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        await onCreate(formData)
        showToast('Cliente Alle cadastrado.')
        form.reset()
        if (!fixedAcademiaId) setAcademiaId(academias[0]?.id ?? '')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao cadastrar cliente Alle.', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <label className="field-label" htmlFor="nome">
          Nome
        </label>
        <input id="nome" name="nome" type="text" required className="input" placeholder="Nome do cliente" />
      </div>

      <div>
        <label className="field-label" htmlFor="academia_id">
          Academia
        </label>
        {fixedAcademiaId ? (
          <>
            <input type="hidden" name="academia_id" value={fixedAcademiaId} />
            <p className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300">
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
        <label className="field-label" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue="ativo" className="select">
          <option value="ativo">Ativo</option>
          <option value="pendente">Pendente de assinatura</option>
          <option value="sem_informacao">Sem informação</option>
          <option value="com_impedimentos">Com impedimentos</option>
          <option value="falta_documentos">Falta documentos</option>
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="telefone">
          Telefone
        </label>
        <input id="telefone" name="telefone" type="text" className="input" placeholder="5511999999999" />
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className="input" placeholder="cliente@exemplo.com" />
      </div>

      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? 'Salvando…' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}
