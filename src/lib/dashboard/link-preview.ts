const FETCH_TIMEOUT_MS = 5000
const MAX_CHARS = 500_000 // teto sobre o HTML já baixado antes de rodar a regex — só precisamos do <head>

// Domínios cujo IP resolve pra range privado/loopback/link-local não deixam passar
// (guarda simples contra SSRF: createMaterial é super_admin-only, mas a URL cadastrada
// é texto livre, e esse fetch roda no servidor com a rede interna dele).
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd00:/i,
]

function isBlockedHostname(hostname: string): boolean {
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))
}

// Vídeo do YouTube tem thumbnail em URL previsível e estável (CDN própria,
// i.ytimg.com) — bem mais rápido e confiável que baixar a página do YouTube e
// procurar og:image nela (o YouTube costuma bloquear/alterar o HTML servido pra
// bots). Cobre watch?v=, youtu.be/, /shorts/ e /embed/.
function youtubeThumbnailUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  let videoId: string | null = null

  if (host === 'youtu.be') {
    videoId = url.pathname.slice(1).split('/')[0] || null
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v')
    } else if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) {
      videoId = url.pathname.split('/')[2] || null
    }
  }

  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
}

// Extração por regex, não HTML parser de verdade — mesmo espírito minimalista de
// src/lib/dashboard/csv.ts (sem dependência nova só pra isso). Aceita og:image e
// twitter:image, em qualquer ordem de atributo (content antes ou depois de
// property/name), pega a primeira ocorrência.
function extractPreviewImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store', // dedup/cache de fetch do Next não faz sentido pra um scrape avulso
      headers: {
        // Alguns sites só servem og:image pra algo que pareça um bot de rede social
        // (WhatsApp/Slack/Discord fazem o mesmo pra gerar prévia de link).
        'User-Agent': 'Mozilla/5.0 (compatible; DashboardAlleEnergiaBot/1.0; +link-preview)',
      },
    })
    if (!response.ok) return ''

    // .text() em vez de ler o stream manualmente byte a byte: mais simples e evita um
    // travamento observado ao consumir response.body.getReader() dentro de uma Server
    // Action (o fetch instrumentado do Next não fecha o stream do jeito esperado nesse
    // contexto). O corte pra MAX_CHARS abaixo, sobre o texto já baixado, ainda evita
    // rodar a regex numa página gigante.
    const html = await response.text()
    return html.slice(0, MAX_CHARS)
  } finally {
    clearTimeout(timeout)
  }
}

// Melhor esforço, nunca lança: quem chama (createMaterial) segue o cadastro mesmo se
// isso voltar null. Nulo tanto pra URL inválida/privada quanto pra qualquer falha de
// rede/timeout/parsing.
export async function fetchLinkPreviewImage(rawUrl: string): Promise<string | null> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (isBlockedHostname(url.hostname)) return null

  const youtubeThumb = youtubeThumbnailUrl(url)
  if (youtubeThumb) return youtubeThumb

  try {
    const html = await fetchHtml(url.toString())
    if (!html) return null

    const imageUrl = extractPreviewImage(html)
    if (!imageUrl) return null

    // Resolve relativo (ex.: "/og-image.png") contra a URL da página.
    const resolved = new URL(imageUrl, url)
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null
    if (isBlockedHostname(resolved.hostname)) return null

    return resolved.toString()
  } catch {
    return null
  }
}
