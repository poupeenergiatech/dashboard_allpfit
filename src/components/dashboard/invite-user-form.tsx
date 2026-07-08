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

export function InviteUserForm({ academias }: { academias: Academia[] }) {
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
        await inviteUser(formData)
        showToast('Convite enviado.')
        form.reset()
        setRole('coordenador')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao convidar usuário.', 'error')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="lg:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="academia_id">
          Academia
        </label>
        <select
          id="academia_id"
          name="academia_id"
          disabled={!needsAcademia}
          required={needsAcademia}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          {pending ? 'Enviando…' : 'Convidar'}
        </button>
      </div>
    </form>
  )
}
