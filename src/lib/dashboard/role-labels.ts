import type { UserRole } from '@/lib/auth/profile'

export const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  gestor: 'Gestor',
  coordenador: 'Coordenador',
  visualizador: 'Visualizador',
}

// Cores intencionalmente distintas — "Gestor" fica em azul de propósito pra não se
// confundir com o violeta de "Super Admin" (ver rebrand pra paleta Alle Energia: as
// duas cores de chrome viraram brand/accent, mas essa distinção categórica entre
// roles foi preservada). Não trocar sem atualizar as duas junto.
export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  super_admin: 'bg-violet-50 text-violet-700',
  gestor: 'bg-blue-50 text-blue-700',
  coordenador: 'bg-emerald-50 text-emerald-700',
  visualizador: 'bg-slate-100 text-slate-600',
}
