'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canWrite, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

// FormData sempre manda string ('' quando o campo fica em branco) — converte pra
// null nesse caso, que é como a coluna de ajuste sinaliza "sem correção manual,
// usar a contagem automática" (ver migration 0002).
function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? '').trim()
  if (!str) return null
  const n = Number(str)
  return Number.isFinite(n) ? n : null
}

export async function saveManualData(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canWrite(profile.role)) {
    throw new Error('Sem permissão para editar dados manuais.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const data = String(formData.get('data') ?? '')
  const totalAlunos = Number(formData.get('total_alunos') ?? 0)
  const totalScans = Number(formData.get('total_scans') ?? 0)
  const contatosAjuste = parseOptionalInt(formData.get('contatos_ajuste'))
  const conversoesAjuste = parseOptionalInt(formData.get('conversoes_ajuste'))

  if (!requestedAcademiaId || !data) {
    throw new Error('Academia e data são obrigatórios.')
  }

  // Sem RLS, essa é a barreira de verdade: um coordenador não pode lançar dados em
  // outra academia mesmo manipulando o campo escondido do formulário.
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (academiaId !== requestedAcademiaId) {
    throw new Error('Sem permissão para editar dados de outra academia.')
  }

  await pool.query(
    `insert into manual_data (academia_id, data, total_alunos, total_scans, contatos_ajuste, conversoes_ajuste, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (academia_id, data)
     do update set total_alunos = excluded.total_alunos, total_scans = excluded.total_scans,
                   contatos_ajuste = excluded.contatos_ajuste, conversoes_ajuste = excluded.conversoes_ajuste,
                   updated_at = now()`,
    [academiaId, data, totalAlunos, totalScans, contatosAjuste, conversoesAjuste]
  )

  revalidatePath('/performance')
  revalidatePath('/')
}
