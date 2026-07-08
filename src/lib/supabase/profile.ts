import { cache } from 'react'
import { createClient } from './server'

export type UserRole = 'super_admin' | 'gestor' | 'coordenador' | 'visualizador'

export type UserProfile = {
  userId: string
  email: string | null
  role: UserRole
  academiaId: string | null
}

// null quando não há sessão. Lança se a sessão existe mas não tem
// user_profiles correspondente (usuário criado no Auth mas nunca convidado
// pelo Super Admin — ver Sprint 4, gestão de usuários).
//
// Envolvida em React.cache() porque agora é chamada tanto no layout (app)
// quanto em cada página — sem isso seria uma query a mais por navegação.
export const getCurrentUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('role, academia_id')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    throw new Error(
      `Usuário ${user.email} autenticado mas sem user_profiles. Peça a um Super Admin para vinculá-lo a uma role.`
    )
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: data.role as UserRole,
    academiaId: data.academia_id,
  }
})

export function canWrite(role: UserRole): boolean {
  return role !== 'visualizador'
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
