'use client'

import { useState, useTransition } from 'react'
import { inviteUser } from '@/app/(app)/usuarios/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'

const ROLES: { value: string; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'visualizador', label: 'Visualizador' },
]

export function InviteUserForm({
  academias,
  onInvite = inviteUser,
}: {
  academias: Academia[]
  onInvite?: (formData: FormData) => Promise<void>
}) {
  const [role, setRole] = useState('coordenador')
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()
  const needsAcademia = role === 'coordenador' || role === 'visualizador'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        await onInvite(formData)
        showToast('Convite enviado.')
        form.reset()
        setRole('coordenador')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao convidar usuário.', 'error')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="input" placeholder="nome@exemplo.com" />
      </div>

      <div>
        <label className="field-label" htmlFor="role">
          Role
        </label>
        <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)} className="select">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="academia_id">
          Academia
        </label>
        <select
          id="academia_id"
          name="academia_id"
          disabled={!needsAcademia}
          required={needsAcademia}
          className="select"
        >
          <option value="">—</option>
          {academias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end lg:col-span-4">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Enviando…' : 'Convidar'}
        </button>
      </div>
    </form>
  )
}
