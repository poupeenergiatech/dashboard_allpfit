'use server'

import { redirect } from 'next/navigation'
import { pool } from '@/lib/db/pool'
import { hashPassword } from '@/lib/auth/password'

const MIN_PASSWORD_LENGTH = 8

export async function resetPasswordWithToken(formData: FormData) {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect(
      `/redefinir-senha?token=${encodeURIComponent(token)}&error=${encodeURIComponent(`Senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)}`
    )
  }
  if (password !== confirmPassword) {
    redirect(`/redefinir-senha?token=${encodeURIComponent(token)}&error=${encodeURIComponent('As senhas não conferem.')}`)
  }

  const { rows } = await pool.query<{ user_id: string }>(
    'select user_id from password_reset_tokens where id = $1 and used_at is null and expires_at > now()',
    [token]
  )
  const userId = rows[0]?.user_id
  if (!userId) {
    // Sem flag extra na URL — a própria página revalida o token contra o banco no
    // carregamento (ver isValidResetToken em RedefinirSenhaPage) e mostra o estado de
    // link inválido/expirado sozinha.
    redirect(`/redefinir-senha?token=${encodeURIComponent(token)}`)
  }

  const passwordHash = await hashPassword(password)

  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('update users set password_hash = $1 where id = $2', [passwordHash, userId])
    // Invalida qualquer outro token de reset pendente do mesmo usuário (não só o usado
    // agora) — evita um link antigo, visto por outra pessoa em algum momento (ex. caixa
    // de email compartilhada), continuar valendo depois que a senha já foi trocada.
    await client.query('update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null', [
      userId,
    ])
    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  redirect(`/login?sucesso=${encodeURIComponent('Senha redefinida com sucesso. Faça login com sua nova senha.')}`)
}
