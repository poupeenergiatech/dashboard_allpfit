'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canWrite, getCurrentUserProfile, seesAllAcademias } from '@/lib/auth/profile'

// Chamada diretamente do client (MarkSignedButton) para poder mostrar toast de
// sucesso/erro — revalidatePath() ainda dispara o refetch do Server Component
// mesmo sem passar por um <form action>.
export async function markAsSigned(id: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canWrite(profile.role)) {
    throw new Error('Sem permissão para marcar como assinado.')
  }

  // Sem RLS, essa é a barreira de verdade pra impedir um coordenador de marcar
  // registros de outra academia. Antes, um UPDATE bloqueado pela policy simplesmente
  // afetava 0 linhas — aqui isso vira um erro explícito em vez de sucesso silencioso.
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const { rowCount } = await pool.query(
    `update pending_signatures
     set assinado = true, assinado_em = now()
     where id = $1
       and ($2::uuid is null or academia_id = $2)`,
    [id, scopedAcademiaId]
  )

  if (rowCount === 0) {
    throw new Error('Registro não encontrado ou sem permissão para esta academia.')
  }

  revalidatePath('/pendentes')
}
