'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { pool } from '@/lib/db/pool'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

// Uma linha por tentativa de login (sucesso ou falha) — alimenta /auditoria. Envolvida
// em try/catch porque, diferente dos outros *_log do projeto, essa gravação nunca pode
// derrubar um login que já deu certo (ou mascarar a mensagem genérica de falha) só
// porque a auditoria teve um problema.
async function logLoginAttempt(entry: { userId: string | null; email: string; status: 'sucesso' | 'erro' }) {
  try {
    const requestHeaders = headers()
    const ipAddress =
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? requestHeaders.get('x-real-ip') ?? null
    const userAgent = requestHeaders.get('user-agent')

    await pool.query(
      `insert into login_audit_log (user_id, email, status, ip_address, user_agent)
       values ($1, $2, $3, $4, $5)`,
      [entry.userId, entry.email, entry.status, ipAddress, userAgent]
    )
  } catch {
    // não bloqueia o login por falha na auditoria
  }
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  // Falha de credenciais e falha de rede/banco levam à mesma mensagem genérica —
  // evita entregar detalhe de infraestrutura numa tela de login.
  let userId: string | null = null
  try {
    const { rows } = await pool.query<{ id: string; password_hash: string }>(
      'select id, password_hash from users where email = $1',
      [email]
    )
    const user = rows[0]
    if (user && (await verifyPassword(password, user.password_hash))) {
      userId = user.id
    }
  } catch {
    userId = null
  }

  if (!userId) {
    await logLoginAttempt({ userId: null, email, status: 'erro' })
    redirect(`/login?error=${encodeURIComponent('Não foi possível entrar. Verifique suas credenciais ou tente novamente.')}`)
  }

  await logLoginAttempt({ userId, email, status: 'sucesso' })
  await createSession(userId)

  redirect('/')
}
