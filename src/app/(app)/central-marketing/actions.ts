'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageMateriaisMarketing, getCurrentUserProfile } from '@/lib/auth/profile'
import { parseMaterialInput } from '@/lib/dashboard/material-form'

export async function createMaterial(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageMateriaisMarketing(profile.role)) {
    throw new Error('Sem permissão para cadastrar materiais.')
  }

  const { titulo, url, descricao, imagemUrl } = await parseMaterialInput(formData)

  await pool.query(
    `insert into materiais_marketing (titulo, url, descricao, imagem_url, created_by) values ($1, $2, $3, $4, $5)`,
    [titulo, url, descricao, imagemUrl, profile.userId]
  )

  revalidatePath('/central-marketing')
}

export async function deleteMaterial(id: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageMateriaisMarketing(profile.role)) {
    throw new Error('Sem permissão para excluir materiais.')
  }

  const { rowCount } = await pool.query('delete from materiais_marketing where id = $1', [id])
  if (rowCount === 0) throw new Error('Material não encontrado.')

  revalidatePath('/central-marketing')
}
