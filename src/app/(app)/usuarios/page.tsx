import { InviteUserForm } from '@/components/dashboard/invite-user-form'
import { UsersTable, type UserRow } from '@/components/dashboard/users-table'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { canManageUsers, getCurrentUserProfile } from '@/lib/supabase/profile'

export default async function UsuariosPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-sm font-medium text-amber-800">
        Acesso restrito ao Super Admin.
      </div>
    )
  }

  const supabaseAdmin = createAdminClient()
  const [{ data: authUsers }, { data: profiles }, { data: academias }] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from('user_profiles').select('user_id, role, academia_id'),
    createClient().from('academias').select('id, nome').eq('ativo', true).order('nome'),
  ])

  const academiaNameById = new Map((academias ?? []).map((a) => [a.id, a.nome]))
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]))

  const users: UserRow[] = (authUsers?.users ?? []).map((u) => {
    const p = profileByUserId.get(u.id)
    return {
      id: u.id,
      email: u.email ?? '—',
      role: p?.role ?? null,
      academiaNome: p?.academia_id ? academiaNameById.get(p.academia_id) ?? null : null,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Usuários</h2>
        <p className="page-subtitle">Gestão de acesso — restrito a Super Admin.</p>
      </div>

      <UsersTable users={users} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Convidar usuário</h3>
        <InviteUserForm academias={academias ?? []} />
      </div>
    </div>
  )
}
