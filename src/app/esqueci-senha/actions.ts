'use server'

import { redirect } from 'next/navigation'
import { pool } from '@/lib/db/pool'
import { getRequestOrigin } from '@/lib/dashboard/request-origin'
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset-email'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1h

// Sempre redireciona pra mesma tela de "verifique seu email", exista ou não uma conta
// com esse endereço — evita confirmar/negar pra quem tá tentando descobrir emails
// cadastrados (mesmo cuidado do login, que usa uma mensagem de erro genérica pra
// credencial errada vs. usuário inexistente, ver login/actions.ts).
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()

  if (email) {
    try {
      const { rows } = await pool.query<{ id: string }>('select id from users where email = $1', [email])
      const userId = rows[0]?.id

      if (userId) {
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
        const { rows: tokenRows } = await pool.query<{ id: string }>(
          'insert into password_reset_tokens (user_id, expires_at) values ($1, $2) returning id',
          [userId, expiresAt]
        )
        const resetUrl = `${getRequestOrigin()}/redefinir-senha?token=${tokenRows[0].id}`
        await sendPasswordResetEmail({ to: email, resetUrl })
      }
    } catch {
      // não vaza detalhe de infra pra tela de login (mesmo padrão de login/actions.ts) —
      // segue pro redirect de sucesso de qualquer forma
    }
  }

  redirect('/esqueci-senha?enviado=1')
}
