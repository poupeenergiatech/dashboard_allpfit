'use server'

import { redirect } from 'next/navigation'
import { pool } from '@/lib/db/pool'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

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
    redirect(`/login?error=${encodeURIComponent('Não foi possível entrar. Verifique suas credenciais ou tente novamente.')}`)
  }

  await createSession(userId)

  redirect('/')
}
