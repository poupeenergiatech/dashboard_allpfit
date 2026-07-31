import { LoginAuditLogTable } from '@/components/dashboard/login-audit-log-table'
import { fetchLoginAuditLog } from '@/lib/dashboard/fetch-login-audit-log'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function AuditoriaPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/10 p-6 text-sm font-medium text-amber-800 dark:text-amber-300">
        Acesso restrito ao Super Admin.
      </div>
    )
  }

  const entries = await fetchLoginAuditLog()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Auditoria de Login</h2>
        <p className="page-subtitle">
          Histórico de tentativas de login (sucesso e falha) — acesso restrito a Super Admin.
        </p>
      </div>

      <LoginAuditLogTable entries={entries} />
    </div>
  )
}
