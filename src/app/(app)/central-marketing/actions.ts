'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageMateriaisMarketing, getCurrentUserProfile } from '@/lib/auth/profile'
import { fetchLinkPreviewImage } from '@/lib/dashboard/link-preview'

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  // Aceita link colado sem esquema ("youtube.com/...") — assume https por padrão,
  // mesmo padrão tolerante que outros campos de link de fora costumam ter.
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export async function createMaterial(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageMateriaisMarketing(profile.role)) {
    throw new Error('Sem permissão para cadastrar materiais.')
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

  // Melhor esforço: extrai a imagem de prévia (og:image, ou thumbnail do YouTube) da
  // própria URL cadastrada — nunca bloqueia o cadastro se isso falhar/der timeout
  // (ver fetchLinkPreviewImage, que já engole qualquer erro e devolve null).
  const imagemUrl = await fetchLinkPreviewImage(url)

  await pool.query(
    `insert into materiais_marketing (titulo, url, descricao, imagem_url, created_by) values ($1, $2, $3, $4, $5)`,
    [titulo, url, descricao || null, imagemUrl, profile.userId]
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
