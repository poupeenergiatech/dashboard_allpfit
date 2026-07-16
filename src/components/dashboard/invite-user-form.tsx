'use client'

import { useState, useTransition } from 'react'
import { createUser, type PasswordResult } from '@/app/(app)/usuarios/actions'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'

const ROLES: { value: string; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'visualizador', label: 'Visualizador' },
]

function randomPassword(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export function InviteUserForm({
  academias,
  onCreate = createUser,
}: {
  academias: Academia[]
  onCreate?: (formData: FormData) => Promise<PasswordResult>
}) {
  const [role, setRole] = useState('coordenador')
  const [password, setPassword] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<PasswordResult | null>(null)
  const { showToast } = useToast()
  const needsAcademia = role === 'coordenador' || role === 'visualizador'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      try {
        const next = await onCreate(formData)
        setResult(next)
        showToast('Usuário criado.')
        form.reset()
        setRole('coordenador')
        setPassword('')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao criar usuário.', 'error')
      }
    })
  }

  return (
    <div className="space-y-4">
      {result && (
        <div className="card border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-300">
          <p className="font-semibold">Usuário criado — compartilhe a senha agora.</p>
          <p className="mt-1">
            Senha{result.generated ? ' gerada' : ''}:{' '}
            <code className="rounded bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.5 font-mono text-emerald-900 dark:text-emerald-300">{result.password}</code>
          </p>
          <p className="mt-1 text-emerald-700 dark:text-emerald-400">
            Ela não fica salva em nenhum lugar — se perder, será preciso redefinir a senha desse usuário.
          </p>
        </div>
      )}

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

        <div className="lg:col-span-2">
          <label className="field-label" htmlFor="password">
            Senha (opcional)
          </label>
          <div className="flex gap-2">
            <input
              id="password"
              name="password"
              type="text"
              minLength={8}
              placeholder="deixe em branco pra gerar uma senha aleatória"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setPassword(randomPassword())} className="btn-secondary shrink-0">
              Gerar
            </button>
          </div>
        </div>

        <div className="flex items-end lg:col-span-2">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? 'Criando…' : 'Criar usuário'}
          </button>
        </div>
      </form>
    </div>
  )
}
