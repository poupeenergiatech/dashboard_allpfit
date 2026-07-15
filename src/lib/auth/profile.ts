import { cache } from 'react'
import { pool } from '@/lib/db/pool'
import { getSessionUserId } from './session'

export type UserRole = 'super_admin' | 'gestor' | 'coordenador' | 'visualizador'

export type UserProfile = {
  userId: string
  email: string | null
  role: UserRole
  academiaId: string | null
}

// null quando não há sessão válida (sem cookie, cookie expirado ou sessão revogada).
// Lança se a sessão existe mas não tem user_profiles correspondente (usuário criado
// mas nunca vinculado a uma role — ver gestão de usuários).
//
// Envolvida em React.cache() porque é chamada tanto no layout (app) quanto em cada
// página — sem isso seria uma query a mais por navegação.
export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const userId = await getSessionUserId()
  if (!userId) return null

  const { rows } = await pool.query<{
    email: string
    role: UserRole | null
    academia_id: string | null
  }>(
    `select u.email, p.role, p.academia_id
     from users u
     left join user_profiles p on p.user_id = u.id
     where u.id = $1`,
    [userId]
  )

  const row = rows[0]
  if (!row) return null

  if (!row.role) {
    throw new Error(
      `Usuário ${row.email} autenticado mas sem user_profiles. Peça a um Super Admin para vinculá-lo a uma role.`
    )
  }

  return {
    userId,
    email: row.email,
    role: row.role,
    academiaId: row.academia_id,
  }
})

export function canWrite(role: UserRole): boolean {
  return role !== 'visualizador'
}

// Dados manuais (scans/ajustes lançados em /performance e /) e o histórico de
// lançamentos: coordenador passou de "pode editar" pra só visualizar (mesmo escopo de
// leitura de sempre, restrito à própria academia), e visualizador — que antes não via
// essa seção — também ganhou acesso de leitura. Só super_admin/gestor continuam
// podendo lançar/editar.
export function canManageManualData(role: UserRole): boolean {
  return role === 'super_admin' || role === 'gestor'
}

export function canManageTraining(role: UserRole): boolean {
  return role === 'super_admin' || role === 'gestor'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'super_admin'
}

export function seesAllAcademias(role: UserRole): boolean {
  return role === 'super_admin' || role === 'gestor'
}

// Sem RLS, essa é a barreira real de escopo por academia — antes o Postgres do
// Supabase filtrava/rejeitava sozinho qualquer linha fora da academia do usuário; agora
// cada leitura/escrita que recebe um academiaId de fora (form, query param, argumento de
// client) precisa passar por aqui. Quem vê todas as academias mantém o valor pedido
// (ou null = "todas"); quem não vê, é forçado pra própria academia, ignorando o que foi
// pedido.
export function scopeAcademiaId(profile: UserProfile, requestedAcademiaId: string | null): string | null {
  if (seesAllAcademias(profile.role)) return requestedAcademiaId
  return profile.academiaId
}
