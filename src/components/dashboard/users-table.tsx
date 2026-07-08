const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  gestor: 'Gestor',
  coordenador: 'Coordenador',
  visualizador: 'Visualizador',
}

export type UserRow = {
  id: string
  email: string
  role: string | null
  academiaNome: string | null
}

export function UsersTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhum usuário cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Academia</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-900">{u.email}</td>
              <td className="px-4 py-3 text-slate-600">
                {u.role ? ROLE_LABEL[u.role] ?? u.role : <span className="text-amber-600">sem perfil</span>}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {u.academiaNome ?? (u.role === 'super_admin' || u.role === 'gestor' ? 'Todas' : '—')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
