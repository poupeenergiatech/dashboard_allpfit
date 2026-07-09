import { InviteUserForm } from '@/components/dashboard/invite-user-form'
import { UsersTable } from '@/components/dashboard/users-table'
import { MOCK_ACADEMIAS, MOCK_USERS } from '@/lib/preview/mock-data'
import { mockInvite } from '@/lib/preview/mock-actions'

export default function PreviewUsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Usuários</h2>
        <p className="page-subtitle">Gestão de acesso — restrito a Super Admin.</p>
      </div>

      <UsersTable users={MOCK_USERS} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Convidar usuário</h3>
        <InviteUserForm academias={MOCK_ACADEMIAS} onInvite={mockInvite} />
      </div>
    </div>
  )
}
