'use client'

import { useMemo, useState, useTransition } from 'react'
import { deleteUser, resetUserPassword, updateUser, type PasswordResult } from '@/app/(app)/usuarios/actions'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'
import type { UserRole } from '@/lib/auth/profile'
import { ROLE_BADGE_CLASS, ROLE_LABEL } from '@/lib/dashboard/role-labels'

export type UserRow = {
  id: string
  email: string
  role: string | null
  academiaId: string | null
  academiaNome: string | null
}

type RoleFilter = 'todos' | 'super_admin' | 'gestor' | 'coordenador' | 'visualizador'
type ResetPasswordAction = (userId: string, formData: FormData) => Promise<PasswordResult>
type UpdateAction = (userId: string, formData: FormData) => Promise<void>
type DeleteAction = (userId: string) => Promise<void>
type RowMode = { id: string; type: 'edit' | 'reset' } | null

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'visualizador', label: 'Visualizador' },
]

function randomPassword(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export function UsersTable({
  users,
  academias,
  currentUserId,
  onResetPassword = resetUserPassword,
  onUpdate = updateUser,
  onDelete = deleteUser,
}: {
  users: UserRow[]
  academias: Academia[]
  currentUserId: string
  onResetPassword?: ResetPasswordAction
  onUpdate?: UpdateAction
  onDelete?: DeleteAction
}) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<RoleFilter>('todos')
  const [activeRow, setActiveRow] = useState<RowMode>(null)
  const [deleting, startDeleteTransition] = useTransition()
  const { showToast } = useToast()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'todos' && u.role !== role) return false
      if (term && !u.email.toLowerCase().includes(term)) return false
      return true
    })
  }, [users, search, role])

  function handleDelete(user: UserRow) {
    if (!window.confirm(`Excluir "${user.email}" definitivamente? Essa ação não pode ser desfeita.`)) {
      return
    }
    startDeleteTransition(async () => {
      try {
        await onDelete(user.id)
        showToast(`${user.email} excluído.`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao excluir usuário.', 'error')
      }
    })
  }

  if (users.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500">
        Nenhum usuário cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por email…"
        statusOptions={ROLE_OPTIONS}
        status={role}
        onStatusChange={setRole}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500">Nenhum usuário encontrado pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Academia</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                if (activeRow?.id === u.id && activeRow.type === 'reset') {
                  return (
                    <ResetPasswordRow
                      key={u.id}
                      user={u}
                      onResetPassword={onResetPassword}
                      onCancel={() => setActiveRow(null)}
                    />
                  )
                }
                if (activeRow?.id === u.id && activeRow.type === 'edit') {
                  return (
                    <UserEditRow
                      key={u.id}
                      user={u}
                      academias={academias}
                      onUpdate={onUpdate}
                      onCancel={() => setActiveRow(null)}
                      onSaved={() => setActiveRow(null)}
                    />
                  )
                }
                return (
                  <tr key={u.id} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.email} />
                        <span className="text-slate-900">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role ? (
                        <span className={`badge ${ROLE_BADGE_CLASS[u.role as UserRole] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ROLE_LABEL[u.role as UserRole] ?? u.role}
                        </span>
                      ) : (
                        <span className="badge bg-amber-50 text-amber-700">sem perfil</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.academiaNome ?? (u.role === 'super_admin' || u.role === 'gestor' ? 'Todas' : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setActiveRow({ id: u.id, type: 'edit' })}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveRow({ id: u.id, type: 'reset' })}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          Redefinir senha
                        </button>
                        {u.id !== currentUserId && (
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDelete(u)}
                            className="text-rose-600 hover:text-rose-800 disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UserEditRow({
  user,
  academias,
  onUpdate,
  onCancel,
  onSaved,
}: {
  user: UserRow
  academias: Academia[]
  onUpdate: UpdateAction
  onCancel: () => void
  onSaved: () => void
}) {
  const [role, setRole] = useState(user.role ?? 'coordenador')
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()
  const needsAcademia = role === 'coordenador' || role === 'visualizador'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        await onUpdate(user.id, formData)
        showToast('Usuário atualizado.')
        onSaved()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar usuário.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 bg-slate-50/70 last:border-0">
      <td className="px-4 py-3" colSpan={4}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label className="field-label" htmlFor={`email-${user.id}`}>
              Email
            </label>
            <input
              id={`email-${user.id}`}
              name="email"
              type="email"
              required
              defaultValue={user.email}
              className="input"
            />
          </div>

          <div>
            <label className="field-label" htmlFor={`role-${user.id}`}>
              Role
            </label>
            <select
              id={`role-${user.id}`}
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="select"
            >
              {(['super_admin', 'gestor', 'coordenador', 'visualizador'] as const).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor={`academia-${user.id}`}>
              Academia
            </label>
            <select
              id={`academia-${user.id}`}
              name="academia_id"
              disabled={!needsAcademia}
              required={needsAcademia}
              defaultValue={user.academiaId ?? ''}
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

          <div className="flex shrink-0 items-center gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}

function ResetPasswordRow({
  user,
  onResetPassword,
  onCancel,
}: {
  user: UserRow
  onResetPassword: ResetPasswordAction
  onCancel: () => void
}) {
  const [password, setPassword] = useState('')
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<PasswordResult | null>(null)
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const next = await onResetPassword(user.id, formData)
        setResult(next)
        showToast('Senha redefinida.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao redefinir senha.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 bg-slate-50/70 last:border-0">
      <td className="px-4 py-3" colSpan={4}>
        {result ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/70 px-3.5 py-2.5 text-sm text-emerald-900">
            <p>
              Nova senha{result.generated ? ' gerada' : ''} de {user.email}:{' '}
              <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-emerald-900">{result.password}</code>{' '}
              — não fica salva em nenhum lugar, copie agora.
            </p>
            <button type="button" onClick={onCancel} className="font-semibold text-emerald-800 underline underline-offset-2">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <label className="field-label" htmlFor={`password-${user.id}`}>
                Nova senha de {user.email} (opcional)
              </label>
              <div className="flex gap-2">
                <input
                  id={`password-${user.id}`}
                  name="password"
                  type="text"
                  minLength={8}
                  placeholder="deixe em branco pra gerar uma senha aleatória"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setPassword(randomPassword())}
                  className="btn-secondary shrink-0"
                >
                  Gerar
                </button>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="submit" disabled={pending} className="btn-primary">
                {pending ? 'Salvando…' : 'Redefinir'}
              </button>
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </td>
    </tr>
  )
}
