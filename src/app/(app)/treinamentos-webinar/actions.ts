'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageTreinamentosWebinar, getCurrentUserProfile } from '@/lib/auth/profile'
import { parseMaterialInput } from '@/lib/dashboard/material-form'

export async function createTreinamentoWebinar(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageTreinamentosWebinar(profile.role)) {
    throw new Error('Sem permissão para cadastrar materiais.')
  }

  const { titulo, url, descricao, imagemUrl } = await parseMaterialInput(formData)

  await pool.query(
    `insert into treinamentos_webinar (titulo, url, descricao, imagem_url, created_by) values ($1, $2, $3, $4, $5)`,
    [titulo, url, descricao, imagemUrl, profile.userId]
  )

  revalidatePath('/treinamentos-webinar')
}

export async function deleteTreinamentoWebinar(id: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageTreinamentosWebinar(profile.role)) {
    throw new Error('Sem permissão para excluir materiais.')
  }

  const { rowCount } = await pool.query('delete from treinamentos_webinar where id = $1', [id])
  if (rowCount === 0) throw new Error('Material não encontrado.')

  revalidatePath('/treinamentos-webinar')
}
