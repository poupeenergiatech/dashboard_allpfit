import { fetchLinkPreviewImage } from './link-preview'

export type ParsedMaterialInput = {
  titulo: string
  url: string
  descricao: string | null
  imagemUrl: string | null
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  // Aceita link colado sem esquema ("youtube.com/...") — assume https por padrão,
  // mesmo padrão tolerante que outros campos de link de fora costumam ter.
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

// Reaproveitado por central-marketing/actions.ts e treinamentos-webinar/actions.ts
// (mesmo formulário "Adicionar material" nas duas páginas, ver
// AddMaterialModal em materiais-grid.tsx) — valida título/link e já resolve a
// prévia de imagem (melhor esforço, nunca lança, ver link-preview.ts) antes do
// insert. Cada action ainda faz a checagem de permissão e o insert na tabela
// certa por conta própria.
export async function parseMaterialInput(formData: FormData): Promise<ParsedMaterialInput> {
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

  const imagemUrl = await fetchLinkPreviewImage(url)

  return { titulo, url, descricao: descricao || null, imagemUrl }
}
