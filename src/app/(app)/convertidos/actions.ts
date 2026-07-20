'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageManualData, getCurrentUserProfile } from '@/lib/auth/profile'

// Só existe pra convertidos "sem unidade" (conversions.academia_id null) — uma vez
// que o sync já insere com `on conflict (alle_documento_id) do nothing`, corrigir a
// origem no Alle Documentos e sincronizar de novo NÃO atualiza esse registro (o
// conflito já existe, o "do nothing" barra até a correção). Esse form é o único
// jeito de vincular a academia certa depois do fato — por isso a query também exige
// `academia_id is null`: convertido que já veio resolvido pelo sync não é pra
// editar manualmente aqui.
export async function updateClienteConvertidoAcademia(conversionId: string, formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar clientes convertidos.')
  }

  const academiaId = String(formData.get('academia_id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = String(formData.get('telefone') ?? '').trim()

  if (!academiaId) {
    throw new Error('Academia é obrigatória.')
  }

  const { rowCount } = await pool.query(
    `update conversions
     set academia_id = $1, nome = $2, telefone = $3
     where id = $4 and academia_id is null`,
    [academiaId, nome || null, telefone || null, conversionId]
  )
  if (rowCount === 0) {
    throw new Error('Convertido não encontrado ou já tem academia vinculada.')
  }

  revalidatePath('/convertidos')
  revalidatePath('/')
  revalidatePath('/performance')
}
