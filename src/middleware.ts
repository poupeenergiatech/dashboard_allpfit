import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'

export function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // `/api` fica de fora: são rotas de sistema (sync do agregador, webhook de relatório)
  // chamadas sem sessão de navegador — cada uma cuida da própria autenticação (chave/segredo
  // próprios). Sem essa exclusão, o middleware redirecionava toda chamada sem cookie de
  // sessão para /login, inclusive as de um cron externo (bug pré-existente, achado ao
  // implementar /api/relatorio — /api/agregador tinha o mesmo problema).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
