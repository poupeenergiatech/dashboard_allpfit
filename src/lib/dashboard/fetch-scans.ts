import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { periodRange } from './period'
import type { DateRange, Period } from './types'

export type ScansPeriod = Period | 'todos'

export type ScansPorAcademia = {
  academiaId: string
  nome: string
  totalScans: number
}

export type ScansDailyPoint = {
  date: string
  totalScans: number
  porAcademia: { academiaId: string; academiaNome: string; totalScans: number }[]
}

export type ScansSummary = {
  totalScans: number
  // Só academias ativas, ordenado do maior pro menor — inclui as com 0 no período
  // (mesma lógica de transparência do breakdown diário: mostra quem não reportou).
  porAcademia: ScansPorAcademia[]
  // Vazio quando period === 'todos' (sem intervalo delimitado pra enumerar dias).
  series: ScansDailyPoint[]
  days: number | null
}

// Todos os dias do intervalo, mesmo sem nenhum registro — mesmo padrão de
// fetch-funnel-counts.ts, pro gráfico de tendência não ter buracos.
function enumerateDays(fromDate: string, days: number): string[] {
  const start = new Date(`${fromDate}T00:00:00`)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

// Totais de scans QR — visão dedicada de /scans, complementar ao card "Scans QR" do
// funil (que só mostra o agregado). Mesma convenção de escopo/período que
// fetch-academia-performance.ts (period 'todos' = histórico inteiro sem filtro de
// data) e mesma correção de fetch-funnel-counts.ts pra academias desativadas: o
// ranking (porAcademia) só lista academias ativas, mas o breakdown diário
// (series[].porAcademia) inclui qualquer academia_id presente em manual_data
// naquele dia, mesmo desativada depois — senão a soma do detalhe fica menor que o
// total exibido.
export async function fetchScansSummary(
  profile: UserProfile,
  period: ScansPeriod = '30dias',
  customRange?: DateRange | null,
  requestedAcademiaId?: string | null
): Promise<ScansSummary> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)
  const range = period === 'todos' ? null : periodRange(period, customRange ?? undefined)

  const [{ rows: academiaRows }, { rows: academiaNomeRows }, { rows: manualRows }] = await Promise.all([
    pool.query<{ id: string; nome: string }>(
      scopedAcademiaId
        ? 'select id, nome from academias where ativo = true and id = $1 order by nome'
        : 'select id, nome from academias where ativo = true order by nome',
      scopedAcademiaId ? [scopedAcademiaId] : []
    ),
    // Sem filtro de ativo — só pra resolver nome no breakdown diário quando a linha
    // de manual_data é de uma academia já desativada.
    pool.query<{ id: string; nome: string }>(
      scopedAcademiaId ? 'select id, nome from academias where id = $1' : 'select id, nome from academias',
      scopedAcademiaId ? [scopedAcademiaId] : []
    ),
    pool.query<{ academia_id: string; data: string; total_scans: number }>(
      `select academia_id, data, total_scans from manual_data
       where ($1::uuid is null or academia_id = $1)
         and ($2::date is null or data >= $2)
         and ($3::date is null or data <= $3)`,
      [scopedAcademiaId, range?.fromDate ?? null, range?.toDate ?? null]
    ),
  ])

  const academiaNomeById = new Map(academiaNomeRows.map((a) => [a.id, a.nome]))

  let totalScans = 0
  const totalPorAcademia = new Map<string, number>()
  const porDiaPorAcademia = new Map<string, Map<string, number>>()

  for (const row of manualRows) {
    const scans = row.total_scans ?? 0
    totalScans += scans
    totalPorAcademia.set(row.academia_id, (totalPorAcademia.get(row.academia_id) ?? 0) + scans)

    const dayMap = porDiaPorAcademia.get(row.data) ?? new Map<string, number>()
    dayMap.set(row.academia_id, (dayMap.get(row.academia_id) ?? 0) + scans)
    porDiaPorAcademia.set(row.data, dayMap)
  }

  // Mesma correção do breakdown diário: o ranking parte das academias ativas (pra
  // mostrar 0 de quem não reportou), mas soma qualquer academia_id presente em
  // manual_data no período mesmo se já desativada — senão a soma do ranking fica
  // menor que "Total de scans no período" (que soma manual_data sem filtrar ativo).
  const idsNoRanking = new Set(academiaRows.map((a) => a.id))
  for (const id of totalPorAcademia.keys()) idsNoRanking.add(id)

  const porAcademia: ScansPorAcademia[] = Array.from(idsNoRanking)
    .map((id) => ({
      academiaId: id,
      nome: academiaNomeById.get(id) ?? '(academia removida)',
      totalScans: totalPorAcademia.get(id) ?? 0,
    }))
    .sort((a, b) => b.totalScans - a.totalScans)

  const series: ScansDailyPoint[] = range
    ? enumerateDays(range.fromDate, range.days).map((date) => {
        const idsDoDia = new Set(academiaRows.map((a) => a.id))
        for (const id of porDiaPorAcademia.get(date)?.keys() ?? []) idsDoDia.add(id)
        return {
          date,
          totalScans: Array.from(porDiaPorAcademia.get(date)?.values() ?? []).reduce((s, v) => s + v, 0),
          porAcademia: Array.from(idsDoDia).map((id) => ({
            academiaId: id,
            academiaNome: academiaNomeById.get(id) ?? '(academia removida)',
            totalScans: porDiaPorAcademia.get(date)?.get(id) ?? 0,
          })),
        }
      })
    : []

  return { totalScans, porAcademia, series, days: range?.days ?? null }
}
