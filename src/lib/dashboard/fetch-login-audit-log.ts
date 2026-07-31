import { pool } from '@/lib/db/pool'

export type LoginAuditLogEntry = {
  id: string
  userId: string | null
  email: string
  currentUserEmail: string | null
  status: 'sucesso' | 'erro'
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

const HISTORY_LIMIT = 500

// Últimas tentativas de login (sucesso e falha), mais recente primeiro — ver
// logLoginAttempt em src/app/login/actions.ts. currentUserEmail vem de users.email hoje
// (pode divergir do email digitado na tentativa, se o usuário trocou de email depois).
export async function fetchLoginAuditLog(): Promise<LoginAuditLogEntry[]> {
  const { rows } = await pool.query<{
    id: string
    user_id: string | null
    email: string
    current_user_email: string | null
    status: 'sucesso' | 'erro'
    ip_address: string | null
    user_agent: string | null
    created_at: string
  }>(
    `select l.id, l.user_id, l.email, u.email as current_user_email, l.status, l.ip_address, l.user_agent, l.created_at
     from login_audit_log l
     left join users u on u.id = l.user_id
     order by l.created_at desc
     limit $1`,
    [HISTORY_LIMIT]
  )

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    currentUserEmail: row.current_user_email,
    status: row.status,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }))
}
