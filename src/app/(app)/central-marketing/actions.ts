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

export async function updateMaterial(id: string, formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageMateriaisMarketing(profile.role)) {
    throw new Error('Sem permissão para editar materiais.')
  }

  const { rows } = await pool.query<{ url: string }>('select url from materiais_marketing where id = $1', [id])
  if (rows.length === 0) throw new Error('Material não encontrado.')

  const { titulo, url, descricao, imagemUrl } = await parseMaterialInput(formData, rows[0].url)

  // imagemUrl undefined = link não mudou, não mexe na coluna (ver
  // parseMaterialInput) — dois updates diferentes em vez de COALESCE porque o
  // valor "quero apagar a prévia" (null, link mudou e não achou og:image) tem
  // que ser gravável também, e COALESCE nunca gravaria null.
  if (imagemUrl === undefined) {
    await pool.query(`update materiais_marketing set titulo = $1, url = $2, descricao = $3 where id = $4`, [
      titulo,
      url,
      descricao,
      id,
    ])
  } else {
    await pool.query(
      `update materiais_marketing set titulo = $1, url = $2, descricao = $3, imagem_url = $4 where id = $5`,
      [titulo, url, descricao, imagemUrl, id]
    )
  }

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
