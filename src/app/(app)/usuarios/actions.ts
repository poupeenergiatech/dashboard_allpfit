'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageUsers, getCurrentUserProfile, type UserRole } from '@/lib/supabase/profile'

const VALID_ROLES: UserRole[] = ['super_admin', 'gestor', 'coordenador', 'visualizador']

export async function inviteUser(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode gerenciar usuários.')
  }

  const email = String(formData.get('email') ?? '').trim()
  const role = String(formData.get('role') ?? '') as UserRole
  const academiaId = String(formData.get('academia_id') ?? '') || null

  if (!email || !VALID_ROLES.includes(role)) {
    throw new Error('Dados inválidos.')
  }

  const needsAcademia = role === 'coordenador' || role === 'visualizador'
  if (needsAcademia && !academiaId) {
    throw new Error('Coordenador e Visualizador precisam de uma academia vinculada.')
  }

  const supabaseAdmin = createAdminClient()

  // Envia um email de convite via Supabase Auth — requer que o projeto tenha o envio
  // de email configurado (funciona out-of-the-box no plano padrão, com rate limit).
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (error) throw error

  const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
    user_id: data.user.id,
    role,
    academia_id: needsAcademia ? academiaId : null,
  })
  if (profileError) throw profileError

  revalidatePath('/usuarios')
}
