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

export async function updateTreinamentoWebinar(id: string, formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageTreinamentosWebinar(profile.role)) {
    throw new Error('Sem permissão para editar materiais.')
  }

  const { rows } = await pool.query<{ url: string }>('select url from treinamentos_webinar where id = $1', [id])
  if (rows.length === 0) throw new Error('Material não encontrado.')

  const { titulo, url, descricao, imagemUrl } = await parseMaterialInput(formData, rows[0].url)

  // Ver comentário equivalente em central-marketing/actions.ts (updateMaterial).
  if (imagemUrl === undefined) {
    await pool.query(`update treinamentos_webinar set titulo = $1, url = $2, descricao = $3 where id = $4`, [
      titulo,
      url,
      descricao,
      id,
    ])
  } else {
    await pool.query(
      `update treinamentos_webinar set titulo = $1, url = $2, descricao = $3, imagem_url = $4 where id = $5`,
      [titulo, url, descricao, imagemUrl, id]
    )
  }

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
