'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageManualData, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

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
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar dados manuais.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const data = String(formData.get('data') ?? '')
  const totalScans = Number(formData.get('total_scans') ?? 0)
  const contatosAjuste = parseOptionalInt(formData.get('contatos_ajuste'))
  // Reprovados e conversoes_manual não têm contagem automática pra substituir
  // (diferente de contatos_ajuste acima) — são números aditivos, mesmo padrão de
  // total_scans, por isso caem pra 0 em vez de null quando o campo fica em branco.
  const reprovados = Number(formData.get('reprovados') ?? 0)
  const conversoesManual = Number(formData.get('conversoes_manual') ?? 0)

  if (!requestedAcademiaId || !data) {
    throw new Error('Academia e data são obrigatórios.')
  }

  // Sem RLS, essa é a barreira de verdade: um coordenador não pode lançar dados em
  // outra academia mesmo manipulando o campo escondido do formulário.
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (academiaId !== requestedAcademiaId) {
    throw new Error('Sem permissão para editar dados de outra academia.')
  }

  // total_alunos não é mais escrito aqui — vem do cadastro da academia (ver
  // fetch-funnel-counts.ts), não de um lançamento diário. Linhas antigas mantêm o
  // valor histórico que já tinham; linhas novas ficam com o default 0 da coluna, sem
  // efeito em nada (nada mais lê manual_data.total_alunos).
  await pool.query(
    `insert into manual_data (academia_id, data, total_scans, contatos_ajuste, conversoes_manual, reprovados, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (academia_id, data)
     do update set total_scans = excluded.total_scans,
                   contatos_ajuste = excluded.contatos_ajuste, conversoes_manual = excluded.conversoes_manual,
                   reprovados = excluded.reprovados,
                   updated_at = now()`,
    [academiaId, data, totalScans, contatosAjuste, conversoesManual, reprovados]
  )

  revalidatePath('/performance')
  revalidatePath('/')
}
