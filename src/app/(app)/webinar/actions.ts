'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageWebinars, getCurrentUserProfile } from '@/lib/auth/profile'

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  // Aceita link colado sem esquema ("youtube.com/...") — assume https por padrão,
  // mesmo padrão tolerante que outros campos de link de fora costumam ter.
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export async function createWebinar(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageWebinars(profile.role)) {
    throw new Error('Sem permissão para cadastrar webinars.')
  }

  const titulo = String(formData.get('titulo') ?? '').trim()
  const urlRaw = String(formData.get('url') ?? '').trim()
  const descricao = String(formData.get('descricao') ?? '').trim()

  if (!titulo) throw new Error('Título é obrigatório.')
  if (!urlRaw) throw new Error('Link é obrigatório.')

  const url = normalizeUrl(urlRaw)
  try {
    new URL(url)
  } catch {
    throw new Error('Link inválido.')
  }

  await pool.query(
    `insert into webinars (titulo, url, descricao, created_by) values ($1, $2, $3, $4)`,
    [titulo, url, descricao || null, profile.userId]
  )

  revalidatePath('/webinar')
}

export async function deleteWebinar(id: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageWebinars(profile.role)) {
    throw new Error('Sem permissão para excluir webinars.')
  }

  const { rowCount } = await pool.query('delete from webinars where id = $1', [id])
  if (rowCount === 0) throw new Error('Webinar não encontrado.')

  revalidatePath('/webinar')
}
