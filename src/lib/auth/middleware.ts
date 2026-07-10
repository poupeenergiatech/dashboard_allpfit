import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from './cookie'

// /preview é uma rota de demonstração com dados fictícios (sem banco real) — só existe
// fora de produção, pra nunca virar um jeito de pular a autenticação de verdade.
const PUBLIC_PATHS =
  process.env.NODE_ENV === 'production' ? ['/login', '/auth'] : ['/login', '/auth', '/preview']

// O middleware roda em Edge runtime, que não suporta conexão TCP crua — `pg` não
// funciona aqui. Por isso essa checagem é só "existe um cookie de sessão?" (redireciona
// sem cookie, deixa passar com cookie). A validação de verdade (sessão existe no banco?
// expirou? qual role/academia?) acontece em (app)/layout.tsx, que roda em Node.js
// runtime — se o cookie for inválido/expirado, o layout redireciona pra /login.
export function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value)

  if (!hasSessionCookie && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSessionCookie && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
