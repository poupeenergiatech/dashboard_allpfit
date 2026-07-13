'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canWrite, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

export async function savePendenciaAssinatura(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canWrite(profile.role)) {
    throw new Error('Sem permissão para editar pendências de assinatura.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const data = String(formData.get('data') ?? '')
  const quantidade = Number(formData.get('quantidade') ?? 0)

  if (!requestedAcademiaId || !data) {
    throw new Error('Academia e data são obrigatórios.')
  }
  if (!Number.isFinite(quantidade) || quantidade < 0) {
    throw new Error('Quantidade inválida.')
  }

  // Sem RLS, essa é a barreira de verdade: um coordenador não pode lançar dados em
  // outra academia mesmo manipulando o campo escondido do formulário.
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (academiaId !== requestedAcademiaId) {
    throw new Error('Sem permissão para editar dados de outra academia.')
  }

  await pool.query(
    `insert into pendencias_assinatura (academia_id, data, quantidade, updated_at)
     values ($1, $2, $3, now())
     on conflict (academia_id, data)
     do update set quantidade = excluded.quantidade, updated_at = now()`,
    [academiaId, data, quantidade]
  )

  revalidatePath('/pendentes')
}
