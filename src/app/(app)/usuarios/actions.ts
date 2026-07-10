'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { generateRandomPassword, hashPassword } from '@/lib/auth/password'
import { canManageUsers, getCurrentUserProfile, type UserRole } from '@/lib/auth/profile'

const VALID_ROLES: UserRole[] = ['super_admin', 'gestor', 'coordenador', 'visualizador']

// Sem serviço de email próprio, o convite por email do Supabase Auth vira "criar
// usuário com senha gerada": a action retorna a senha uma única vez pro Super Admin
// repassar (mesmo padrão de scripts/seed-admin.mjs).
export async function createUser(formData: FormData): Promise<{ password: string }> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode gerenciar usuários.')
  }

  const email = String(formData.get('email') ?? '').trim()
  const role = String(formData.get('role') ?? '') as UserRole
  const academiaId = String(formData.get('academia_id') ?? '') || null

  if (!email || !VALID_ROLES.includes(role)) {
    throw new Error('Dados inválidos.')
  }

  const needsAcademia = role === 'coordenador' || role === 'visualizador'
  if (needsAcademia && !academiaId) {
    throw new Error('Coordenador e Visualizador precisam de uma academia vinculada.')
  }

  const password = generateRandomPassword()
  const passwordHash = await hashPassword(password)

  const client = await pool.connect()
  try {
    await client.query('begin')

    let userId: string
    try {
      const { rows } = await client.query<{ id: string }>(
        'insert into users (email, password_hash) values ($1, $2) returning id',
        [email, passwordHash]
      )
      userId = rows[0].id
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new Error('Já existe um usuário com este email.')
      }
      throw err
    }

    await client.query(
      'insert into user_profiles (user_id, role, academia_id) values ($1, $2, $3)',
      [userId, role, needsAcademia ? academiaId : null]
    )

    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  revalidatePath('/usuarios')
  return { password }
}
