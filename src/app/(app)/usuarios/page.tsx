import { InviteUserForm } from '@/components/dashboard/invite-user-form'
import { UsersTable, type UserRow } from '@/components/dashboard/users-table'
import { pool } from '@/lib/db/pool'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function UsuariosPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-sm font-medium text-amber-800">
        Acesso restrito ao Super Admin.
      </div>
    )
  }

  const [{ rows: users }, { rows: academias }] = await Promise.all([
    pool.query<{ id: string; email: string; role: string | null; academia_nome: string | null }>(
      `select u.id, u.email, p.role, a.nome as academia_nome
       from users u
       left join user_profiles p on p.user_id = u.id
       left join academias a on a.id = p.academia_id
       order by u.email`
    ),
    pool.query<{ id: string; nome: string }>(
      'select id, nome from academias where ativo = true order by nome'
    ),
  ])

  const userRows: UserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    academiaNome: u.academia_nome,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Usuários</h2>
        <p className="page-subtitle">Gestão de acesso — restrito a Super Admin.</p>
      </div>

      <UsersTable users={userRows} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Criar usuário</h3>
        <InviteUserForm academias={academias} />
      </div>
    </div>
  )
}
