'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canManageTraining, getCurrentUserProfile } from '@/lib/supabase/profile'

export async function setTrained(academiaId: string, treinada: boolean) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageTraining(profile.role)) {
    throw new Error('Apenas Super Admin e Gestor podem alterar o status de treinamento.')
  }

  const supabase = createClient()
  // Reforçado pela policy trained_academias_write (S4-10) — mesmo que o check acima
  // fosse contornado, um coordenador teria 0 linhas afetadas aqui.
  const { error } = await supabase
    .from('trained_academias')
    .upsert({ academia_id: academiaId, treinada, updated_at: new Date().toISOString() })

  if (error) throw error

  revalidatePath('/treinadas')
}
