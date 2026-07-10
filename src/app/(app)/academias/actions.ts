'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'

export async function createAcademia(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode cadastrar academias.')
  }

  const nome = String(formData.get('nome') ?? '').trim()
  const numeroTelefone = String(formData.get('numero_telefone') ?? '').trim()

  if (!nome) {
    throw new Error('Nome é obrigatório.')
  }

  await pool.query('insert into academias (nome, numero_telefone, ativo) values ($1, $2, true)', [
    nome,
    numeroTelefone || null,
  ])

  revalidatePath('/academias')
  revalidatePath('/')
}

// Sem delete: desativar preserva o histórico (contacts/conversions/manual_data já
// lançados continuam apontando pra essa academia) e some dela dos dropdowns/abas —
// fetchActiveAcademias só lista `ativo = true`.
export async function setAcademiaActive(academiaId: string, ativo: boolean) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode ativar/desativar academias.')
  }

  await pool.query('update academias set ativo = $1 where id = $2', [ativo, academiaId])

  revalidatePath('/academias')
  revalidatePath('/')
}
