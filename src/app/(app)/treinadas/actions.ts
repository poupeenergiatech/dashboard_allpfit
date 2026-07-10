'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageTraining, getCurrentUserProfile } from '@/lib/auth/profile'

export async function setTrained(academiaId: string, treinada: boolean) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageTraining(profile.role)) {
    throw new Error('Apenas Super Admin e Gestor podem alterar o status de treinamento.')
  }

  await pool.query(
    `insert into trained_academias (academia_id, treinada, updated_at)
     values ($1, $2, now())
     on conflict (academia_id) do update set treinada = excluded.treinada, updated_at = now()`,
    [academiaId, treinada]
  )

  revalidatePath('/treinadas')
}
