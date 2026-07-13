'use client'

import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  gestor: 'Gestor',
  coordenador: 'Coordenador',
  visualizador: 'Visualizador',
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-violet-50 text-violet-700',
  gestor: 'bg-blue-50 text-blue-700',
  coordenador: 'bg-emerald-50 text-emerald-700',
  visualizador: 'bg-slate-100 text-slate-600',
}

export type UserRow = {
  id: string
  email: string
  role: string | null
  academiaNome: string | null
}

type RoleFilter = 'todos' | 'super_admin' | 'gestor' | 'coordenador' | 'visualizador'

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'visualizador', label: 'Visualizador' },
]

export function UsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<RoleFilter>('todos')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'todos' && u.role !== role) return false
      if (term && !u.email.toLowerCase().includes(term)) return false
      return true
    })
  }, [users, search, role])

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
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Academia</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.email} />
                      <span className="text-slate-900">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role ? (
                      <span className={`badge ${ROLE_BADGE[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-700">sem perfil</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.academiaNome ?? (u.role === 'super_admin' || u.role === 'gestor' ? 'Todas' : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
