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

function keyOf(academiaId: string, day: string): string {
  return `${academiaId}|${day}`
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

  const [{ rows: manualRows }, { rows: contatosPorDia }, { rows: conversoesPorDia }] = await Promise.all([
    pool.query<{
      academia_id: string
      data: string
      total_alunos: number
      total_scans: number
      contatos_ajuste: number | null
      conversoes_ajuste: number | null
    }>(
      `select academia_id, data, total_alunos, total_scans, contatos_ajuste, conversoes_ajuste
       from manual_data
       where data >= $1 and ($2::uuid is null or academia_id = $2)`,
      [fromDate, academiaId]
    ),
    pool.query<{ academia_id: string; day: string; count: number }>(
      `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from contacts
       where created_at >= $1 and ($2::uuid is null or academia_id = $2)
       group by academia_id, day`,
      [from, academiaId]
    ),
    pool.query<{ academia_id: string; day: string; count: number }>(
      `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from conversions
       where created_at >= $1 and ($2::uuid is null or academia_id = $2)
       group by academia_id, day`,
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

  // Contatos/conversões: por padrão é a contagem automática (contacts/conversions,
  // por academia+dia); quando existe um ajuste manual pra aquele academia+dia (ver
  // migration 0002), ele substitui a contagem automática por completo — não soma em
  // cima. O merge é por chave academia_id+dia pra um ajuste não "vazar" pra outra
  // academia quando o filtro é "todas".
  const rawContatos = new Map(contatosPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))
  const rawConversoes = new Map(conversoesPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))
  const effectiveContatos = new Map(rawContatos)
  const effectiveConversoes = new Map(rawConversoes)

  for (const row of manualRows) {
    const key = keyOf(row.academia_id, row.data)
    if (row.contatos_ajuste != null) effectiveContatos.set(key, row.contatos_ajuste)
    if (row.conversoes_ajuste != null) effectiveConversoes.set(key, row.conversoes_ajuste)
  }

  let totalContatos = 0
  let totalConversoes = 0
  const contatosPorDiaEfetivo = new Map<string, number>()
  const conversoesPorDiaEfetivo = new Map<string, number>()

  for (const [key, value] of effectiveContatos) {
    const day = key.split('|')[1]
    totalContatos += value
    contatosPorDiaEfetivo.set(day, (contatosPorDiaEfetivo.get(day) ?? 0) + value)
  }
  for (const [key, value] of effectiveConversoes) {
    const day = key.split('|')[1]
    totalConversoes += value
    conversoesPorDiaEfetivo.set(day, (conversoesPorDiaEfetivo.get(day) ?? 0) + value)
  }

  const series: DailyFunnelPoint[] = enumerateDays(fromDate, DAYS_BY_PERIOD[period]).map((date) => ({
    date,
    contatos: contatosPorDiaEfetivo.get(date) ?? 0,
    conversoes: conversoesPorDiaEfetivo.get(date) ?? 0,
  }))

  return {
    totalAlunos,
    totalScans,
    totalContatos,
    totalConversoes,
    series,
  }
}
