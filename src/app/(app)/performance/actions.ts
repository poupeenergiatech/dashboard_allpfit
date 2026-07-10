'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canWrite, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

export async function saveManualData(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canWrite(profile.role)) {
    throw new Error('Sem permissão para editar dados manuais.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const data = String(formData.get('data') ?? '')
  const totalAlunos = Number(formData.get('total_alunos') ?? 0)
  const totalScans = Number(formData.get('total_scans') ?? 0)

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
    `insert into manual_data (academia_id, data, total_alunos, total_scans, updated_at)
     values ($1, $2, $3, $4, now())
     on conflict (academia_id, data)
     do update set total_alunos = excluded.total_alunos, total_scans = excluded.total_scans, updated_at = now()`,
    [academiaId, data, totalAlunos, totalScans]
  )

  revalidatePath('/performance')
  revalidatePath('/')
}
