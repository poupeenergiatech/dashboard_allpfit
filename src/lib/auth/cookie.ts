// Nome do cookie de sessão. Em módulo próprio (sem importar nada de src/lib/db) porque
// o middleware roda em Edge runtime e não pode puxar `pg` transitivamente.
export const SESSION_COOKIE_NAME = 'session'
