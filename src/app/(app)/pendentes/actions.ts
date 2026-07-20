'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageUsers, canWrite, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

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

export type ResetPendenciasResult = {
  lancamentosZerados: number
}

// Zera só o lançamento manual (pendencias_assinatura) — o outro pedaço da
// contagem, clientes com status 'pendente' em clientes_alle (ver
// fetch-pendencias-assinatura.ts), tem seu próprio ciclo de vida em /clientes-alle
// e não é afetado aqui. Mesmo guard/escopo do reset de conversões
// (resetAllConversoes em configuracoes/actions.ts): ação destrutiva cobrindo todas
// as academias, restrita a Super Admin.
export async function resetPendencias(): Promise<ResetPendenciasResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode resetar pendências.')
  }

  const { rowCount } = await pool.query(
    `update pendencias_assinatura set quantidade = 0, updated_at = now() where quantidade != 0`
  )

  revalidatePath('/pendentes')
  revalidatePath('/')

  return { lancamentosZerados: rowCount ?? 0 }
}
