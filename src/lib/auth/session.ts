import { cookies } from 'next/headers'
import { pool } from '@/lib/db/pool'
import { SESSION_COOKIE_NAME as COOKIE_NAME } from './cookie'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

// Só pode ser chamada de Server Actions / Route Handlers (onde escrever cookies é
// permitido) — mesma restrição que já existia com o client Supabase de sessão.
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  const { rows } = await pool.query<{ id: string }>(
    'insert into sessions (user_id, expires_at) values ($1, $2) returning id',
    [userId, expiresAt]
  )

  cookies().set(COOKIE_NAME, rows[0].id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

// Lê o cookie e valida contra a tabela sessions (existe + não expirou). Retorna null
// se não houver sessão válida — chamada em qualquer Server Component/Action/Route
// Handler (todos rodam em Node.js runtime, diferente do middleware).
export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null

  const { rows } = await pool.query<{ user_id: string }>(
    'select user_id from sessions where id = $1 and expires_at > now()',
    [token]
  )

  return rows[0]?.user_id ?? null
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (token) {
    await pool.query('delete from sessions where id = $1', [token])
  }
  cookies().delete(COOKIE_NAME)
}
