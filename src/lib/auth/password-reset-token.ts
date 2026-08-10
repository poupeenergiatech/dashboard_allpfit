import { pool } from '@/lib/db/pool'

// Usado tanto por /redefinir-senha (Server Component, decide se mostra o formulário ou
// o estado de "link inválido/expirado" já no carregamento da página, sem esperar um
// submit) quanto pela action de troca de senha (resetPasswordWithToken). `token` vem de
// query string / campo de formulário — pode não ser um UUID válido, o que faria o
// Postgres lançar erro de cast na comparação com a coluna uuid; tratado como token
// inválido, não como erro de infra.
export async function isValidResetToken(token: string): Promise<boolean> {
  if (!token) return false

  try {
    const { rows } = await pool.query(
      'select 1 from password_reset_tokens where id = $1 and used_at is null and expires_at > now()',
      [token]
    )
    return rows.length > 0
  } catch {
    return false
  }
}
