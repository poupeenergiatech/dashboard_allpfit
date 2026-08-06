import { headers } from 'next/headers'

// Detecta protocolo+host de quem fez a requisição atual — funciona em qualquer domínio
// sem precisar configurar nada (mesmo padrão de getWebhookUrl em
// app/(app)/configuracoes/page.tsx, só que devolvendo a origem em vez de uma URL de
// webhook específica). Funciona tanto em Server Components quanto em Server Actions.
export function getRequestOrigin(): string {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000'
  const proto = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
