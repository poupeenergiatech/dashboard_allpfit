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

// Trava contra o sistema ficar sem ninguém capaz de gerenciar usuários: bloqueia
// editar (pra outro role) ou excluir o único user_profiles.role = 'super_admin'
// restante. Só entra em ação quando o alvo já É o último super_admin — não impede
// nada pra qualquer outro usuário.
async function assertNotLastSuperAdmin(userId: string, message: string) {
  const { rows } = await pool.query<{ role: UserRole | null }>(
    'select role from user_profiles where user_id = $1',
    [userId]
  )
  if (rows[0]?.role !== 'super_admin') return

  const { rows: countRows } = await pool.query<{ count: string }>(
    "select count(*) from user_profiles where role = 'super_admin'"
  )
  if (Number(countRows[0].count) <= 1) {
    throw new Error(message)
  }
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

// Edita email/role/academia de um usuário já existente. Mesma validação de
// createUser (coordenador/visualizador precisam de academia); se a mudança de role
// tirar o único Super Admin restante do cargo, bloqueia.
export async function updateUser(userId: string, formData: FormData) {
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

  if (role !== 'super_admin') {
    await assertNotLastSuperAdmin(
      userId,
      'Não é possível mudar o role do único Super Admin restante — promova outro usuário antes.'
    )
  }

  const client = await pool.connect()
  try {
    await client.query('begin')

    try {
      const { rowCount } = await client.query('update users set email = $1 where id = $2', [email, userId])
      if (rowCount === 0) {
        throw new Error('Usuário não encontrado.')
      }
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new Error('Já existe um usuário com este email.')
      }
      throw err
    }

    await client.query('update user_profiles set role = $1, academia_id = $2 where user_id = $3', [
      role,
      needsAcademia ? academiaId : null,
      userId,
    ])

    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  revalidatePath('/usuarios')
}

// Exclusão de verdade — users.id em cascata limpa sessions/user_profiles (ver
// migration 0001). Duas travas além da checagem de role: ninguém exclui a própria
// conta (evita se trancar fora sem querer) e o último Super Admin não pode ser
// excluído (evita o sistema ficar sem ninguém pra gerenciar usuários).
export async function deleteUser(userId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode gerenciar usuários.')
  }

  if (userId === profile.userId) {
    throw new Error('Você não pode excluir sua própria conta.')
  }

  await assertNotLastSuperAdmin(userId, 'Não é possível excluir o único Super Admin restante — promova outro usuário antes.')

  const { rowCount } = await pool.query('delete from users where id = $1', [userId])
  if (rowCount === 0) {
    throw new Error('Usuário não encontrado.')
  }

  revalidatePath('/usuarios')
}
