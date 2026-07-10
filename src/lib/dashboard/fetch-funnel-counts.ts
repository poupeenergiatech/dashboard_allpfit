'use server'

import { pool } from '@/lib/db/pool'
import { getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'
import { periodRange } from './period'
import type { FunnelCounts, Period } from './types'

// Chamada como Server Action direto do hook client (use-funnel-data.ts) — roda em
// Node.js runtime, então pode falar com o Postgres. requestedAcademiaId vem do filtro
// escolhido no client, mas é sempre resolvido de novo aqui via scopeAcademiaId: sem
// RLS, essa é a única barreira real contra um coordenador pedindo dados de outra
// academia manipulando o valor no client.
export async function fetchFunnelCounts(
  requestedAcademiaId: string | null,
  period: Period
): Promise<FunnelCounts> {
  const profile = await getCurrentUserProfile()
  if (!profile) throw new Error('Sem sessão válida.')

  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  const { from, fromDate } = periodRange(period)

  const [{ rows: contactsRows }, { rows: conversionsRows }, { rows: manualRows }] = await Promise.all([
    pool.query<{ count: number }>(
      `select count(*) as count from contacts
       where created_at >= $1 and ($2::uuid is null or academia_id = $2)`,
      [from, academiaId]
    ),
    pool.query<{ count: number }>(
      `select count(*) as count from conversions
       where created_at >= $1 and ($2::uuid is null or academia_id = $2)`,
      [from, academiaId]
    ),
    pool.query<{ academia_id: string; data: string; total_alunos: number; total_scans: number }>(
      `select academia_id, data, total_alunos, total_scans from manual_data
       where data >= $1 and ($2::uuid is null or academia_id = $2)`,
      [fromDate, academiaId]
    ),
  ])

  // total_alunos é um snapshot (não é aditivo): pega o valor mais recente dentro do
  // período, por academia, e soma entre academias quando o filtro é "todas".
  // total_scans é aditivo: soma direta de todas as linhas do período.
  const latestAlunosByAcademia = new Map<string, { data: string; total_alunos: number }>()
  let totalScans = 0

  for (const row of manualRows) {
    totalScans += row.total_scans ?? 0
    const prev = latestAlunosByAcademia.get(row.academia_id)
    if (!prev || row.data > prev.data) {
      latestAlunosByAcademia.set(row.academia_id, row)
    }
  }

  const totalAlunos = [...latestAlunosByAcademia.values()].reduce(
    (sum, row) => sum + (row.total_alunos ?? 0),
    0
  )

  return {
    totalAlunos,
    totalScans,
    totalContatos: contactsRows[0]?.count ?? 0,
    totalConversoes: conversionsRows[0]?.count ?? 0,
  }
}
