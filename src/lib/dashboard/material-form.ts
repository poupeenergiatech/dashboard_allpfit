import { fetchLinkPreviewImage } from './link-preview'

export type ParsedMaterialInput = {
  titulo: string
  url: string
  descricao: string | null
  // undefined só acontece em edição com o link inalterado (ver currentUrl
  // abaixo) — sinaliza "não mexe no imagem_url que já tá salvo", diferente de
  // null (resolveu e não achou prévia nenhuma).
  imagemUrl: string | null | undefined
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  // Aceita link colado sem esquema ("youtube.com/...") — assume https por padrão,
  // mesmo padrão tolerante que outros campos de link de fora costumam ter.
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

// Reaproveitado por central-marketing/actions.ts e treinamentos-webinar/actions.ts
// (mesmo formulário de material nas duas páginas, ver MaterialFormModal em
// materiais-grid.tsx) — valida título/link e resolve a prévia de imagem
// (melhor esforço, nunca lança, ver link-preview.ts). Cada action ainda faz a
// checagem de permissão e o insert/update na tabela certa por conta própria.
//
// currentUrl: passado só por updateMaterial/updateTreinamentoWebinar, com o
// url que já tá salvo na linha. Se o link editado é o mesmo, pula o fetch de
// prévia (custa uma chamada de rede à toa, e uma falha/timeout transitório
// nessa hora apagaria uma thumbnail que já funcionava) — só refaz a prévia
// quando o link de fato muda. Na criação (currentUrl undefined) sempre resolve,
// comportamento inalterado.
export async function parseMaterialInput(formData: FormData, currentUrl?: string): Promise<ParsedMaterialInput> {
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

  if (currentUrl !== undefined && url === currentUrl) {
    return { titulo, url, descricao: descricao || null, imagemUrl: undefined }
  }

  const imagemUrl = await fetchLinkPreviewImage(url)

  return { titulo, url, descricao: descricao || null, imagemUrl }
}
