'use client'

import { useTransition } from 'react'
import { createAcademia } from '@/app/(app)/academias/actions'
import { useToast } from '@/components/ui/toast'

export function CreateAcademiaForm({ onCreate = createAcademia }: { onCreate?: (formData: FormData) => Promise<void> }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        await onCreate(formData)
        showToast('Academia cadastrada.')
        form.reset()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao cadastrar academia.', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className="field-label" htmlFor="nome">
          Nome da unidade
        </label>
        <input id="nome" name="nome" type="text" required className="input" placeholder="Allp Fit - Unidade Centro" />
      </div>

      <div>
        <label className="field-label" htmlFor="numero_telefone">
          Número de WhatsApp (agregador)
        </label>
        <input
          id="numero_telefone"
          name="numero_telefone"
          type="text"
          className="input"
          placeholder="5511999999999"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="total_alunos">
          Total de alunos
        </label>
        <input id="total_alunos" name="total_alunos" type="number" min={0} defaultValue={0} className="input" />
      </div>

      <div>
        <label className="field-label" htmlFor="conversoes_ajuste_total">
          Ajuste de conversões (opcional)
        </label>
        <input
          id="conversoes_ajuste_total"
          name="conversoes_ajuste_total"
          type="number"
          defaultValue={0}
          className="input"
        />
      </div>

      <div className="flex items-end lg:col-span-4">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Cadastrando…' : 'Cadastrar academia'}
        </button>
      </div>
    </form>
  )
}
