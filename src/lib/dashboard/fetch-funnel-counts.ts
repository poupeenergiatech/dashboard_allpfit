'use server'

import { pool } from '@/lib/db/pool'
import { getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'
import { DAYS_BY_PERIOD, periodRange } from './period'
import type { DailyFunnelPoint, FunnelCounts, Period } from './types'

// Todos os dias do período, mesmo os sem nenhum registro — sem isso o gráfico de
// tendência teria buracos em vez de mostrar "zero" no dia. Calculado em JS (fuso do
// processo Node), mesmo padrão de fetch-numeros.ts.
function enumerateDays(fromDate: string, days: number): string[] {
  const start = new Date(`${fromDate}T00:00:00`)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

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

  const [
    { rows: contactsRows },
    { rows: conversionsRows },
    { rows: manualRows },
    { rows: contatosPorDia },
    { rows: conversoesPorDia },
  ] = await Promise.all([
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
    pool.query<{ day: string; count: number }>(
      `select date_trunc('day', created_at)::date as day, count(*) as count from contacts
       where created_at >= $1 and ($2::uuid is null or academia_id = $2)
       group by day`,
      [from, academiaId]
    ),
    pool.query<{ day: string; count: number }>(
      `select date_trunc('day', created_at)::date as day, count(*) as count from conversions
       where created_at >= $1 and ($2::uuid is null or academia_id = $2)
       group by day`,
      [from, academiaId]
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

  const contatosByDay = new Map(contatosPorDia.map((r) => [r.day, r.count]))
  const conversoesByDay = new Map(conversoesPorDia.map((r) => [r.day, r.count]))

  const series: DailyFunnelPoint[] = enumerateDays(fromDate, DAYS_BY_PERIOD[period]).map((date) => ({
    date,
    contatos: contatosByDay.get(date) ?? 0,
    conversoes: conversoesByDay.get(date) ?? 0,
  }))

  return {
    totalAlunos,
    totalScans,
    totalContatos: contactsRows[0]?.count ?? 0,
    totalConversoes: conversionsRows[0]?.count ?? 0,
    series,
  }
}
