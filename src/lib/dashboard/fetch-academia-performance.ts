import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { periodRange } from './period'
import type { DateRange, Period } from './types'

export type AcademiaPerformance = {
  academiaId: string
  nome: string
  totalContatos: number
  totalConversoes: number
}

export type PerformancePeriod = Period | 'todos'

function keyOf(academiaId: string, day: string): string {
  return `${academiaId}|${day}`
}

// Totais por academia — por padrão (period 'todos') soma o histórico inteiro, sem
// filtro de data, igual ao comportamento original desta tela; os outros valores de
// period (ver PerformancePeriod) escopam pro intervalo escolhido no filtro da tela.
// Não usa mais a view `academia_performance` (db/migrations/0001_init.sql) — ela não
// sabe de contatos_ajuste/conversoes_ajuste (migration 0002), então deixaria de
// refletir correções manuais. Mesmo merge de fetch-funnel-counts.ts (ajuste substitui
// a contagem automática por academia+dia), só que somando o período pedido.
export async function fetchAcademiaPerformance(
  profile: UserProfile,
  period: PerformancePeriod = 'todos',
  customRange?: DateRange | null,
  requestedAcademiaId?: string | null
): Promise<AcademiaPerformance[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const range = period === 'todos' ? null : periodRange(period, customRange ?? undefined)

  const [{ rows: academias }, { rows: contatosPorDia }, { rows: conversoesPorDia }, { rows: ajustes }] =
    await Promise.all([
      pool.query<{ id: string; nome: string }>(
        scopedAcademiaId
          ? 'select id, nome from academias where ativo = true and id = $1 order by nome'
          : 'select id, nome from academias where ativo = true order by nome',
        scopedAcademiaId ? [scopedAcademiaId] : []
      ),
      pool.query<{ academia_id: string; day: string; count: number }>(
        `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from contacts
         where ($1::uuid is null or academia_id = $1)
           and ($2::timestamptz is null or created_at >= $2)
           and ($3::timestamptz is null or created_at < $3)
         group by academia_id, day`,
        [scopedAcademiaId, range?.from ?? null, range?.toExclusive ?? null]
      ),
      pool.query<{ academia_id: string; day: string; count: number }>(
        `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from conversions
         where ($1::uuid is null or academia_id = $1)
           and ($2::timestamptz is null or created_at >= $2)
           and ($3::timestamptz is null or created_at < $3)
         group by academia_id, day`,
        [scopedAcademiaId, range?.from ?? null, range?.toExclusive ?? null]
      ),
      pool.query<{
        academia_id: string
        data: string
        contatos_ajuste: number | null
        conversoes_ajuste: number | null
      }>(
        `select academia_id, data, contatos_ajuste, conversoes_ajuste from manual_data
         where (contatos_ajuste is not null or conversoes_ajuste is not null)
           and ($1::uuid is null or academia_id = $1)
           and ($2::date is null or data >= $2)
           and ($3::date is null or data <= $3)`,
        [scopedAcademiaId, range?.fromDate ?? null, range?.toDate ?? null]
      ),
    ])

  const effectiveContatos = new Map(contatosPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))
  const effectiveConversoes = new Map(conversoesPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))

  for (const row of ajustes) {
    const key = keyOf(row.academia_id, row.data)
    if (row.contatos_ajuste != null) effectiveContatos.set(key, row.contatos_ajuste)
    if (row.conversoes_ajuste != null) effectiveConversoes.set(key, row.conversoes_ajuste)
  }

  const totalContatosByAcademia = new Map<string, number>()
  const totalConversoesByAcademia = new Map<string, number>()

  for (const [key, value] of effectiveContatos) {
    const id = key.split('|')[0]
    totalContatosByAcademia.set(id, (totalContatosByAcademia.get(id) ?? 0) + value)
  }
  for (const [key, value] of effectiveConversoes) {
    const id = key.split('|')[0]
    totalConversoesByAcademia.set(id, (totalConversoesByAcademia.get(id) ?? 0) + value)
  }

  return academias.map((a) => ({
    academiaId: a.id,
    nome: a.nome,
    totalContatos: totalContatosByAcademia.get(a.id) ?? 0,
    totalConversoes: totalConversoesByAcademia.get(a.id) ?? 0,
  }))
}
