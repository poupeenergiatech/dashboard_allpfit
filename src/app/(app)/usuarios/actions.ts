'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { generateRandomPassword, hashPassword } from '@/lib/auth/password'
import { canManageUsers, getCurrentUserProfile, type UserRole } from '@/lib/auth/profile'

const VALID_ROLES: UserRole[] = ['super_admin', 'gestor', 'coordenador', 'visualizador']
const MIN_PASSWORD_LENGTH = 8

export type PasswordResult = { password: string; generated: boolean }

// Senha em branco no formulário = gera uma aleatória (comportamento original);
// preenchida = usa a que o Super Admin digitou, contanto que passe do tamanho
// mínimo. `generated` volta pra UI decidir a mensagem certa (gerada precisa do
// aviso "não fica salva em lugar nenhum"; digitada não).
function resolvePassword(formData: FormData): PasswordResult {
  const typed = String(formData.get('password') ?? '').trim()
  if (!typed) {
    return { password: generateRandomPassword(), generated: true }
  }
  if (typed.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  }
  return { password: typed, generated: false }
}

// Sem serviço de email próprio, o convite por email do Supabase Auth vira "criar
// usuário com senha (gerada ou definida pelo Super Admin)": a action retorna a senha
// uma única vez pro Super Admin repassar (mesmo padrão de scripts/seed-admin.mjs).
export async function createUser(formData: FormData): Promise<PasswordResult> {
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

  const result = resolvePassword(formData)
  const passwordHash = await hashPassword(result.password)

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
  return result
}

// Mesma lógica de resolvePassword (branco = gera, preenchida = usa a digitada) —
// pra corrigir a senha de um usuário já existente sem precisar recriar a conta.
export async function resetUserPassword(userId: string, formData: FormData): Promise<PasswordResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode gerenciar usuários.')
  }

  const result = resolvePassword(formData)
  const passwordHash = await hashPassword(result.password)

  const { rowCount } = await pool.query('update users set password_hash = $1 where id = $2', [
    passwordHash,
    userId,
  ])

  if (rowCount === 0) {
    throw new Error('Usuário não encontrado.')
  }

  revalidatePath('/usuarios')
  return result
}
