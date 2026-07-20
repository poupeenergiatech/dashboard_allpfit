import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { periodRange } from './period'
import type { DateRange, Period } from './types'

export type AcademiaPerformance = {
  academiaId: string
  nome: string
  totalContatos: number
  totalConversoesAne: number
  totalConversoesManual: number
  totalConversoes: number
  conversoesManualAjusteTotal: number
}

export type PerformancePeriod = Period | 'todos'

function keyOf(academiaId: string, day: string): string {
  return `${academiaId}|${day}`
}

// Totais por academia — por padrão (period 'todos') soma o histórico inteiro, sem
// filtro de data, igual ao comportamento original desta tela; os outros valores de
// period (ver PerformancePeriod) escopam pro intervalo escolhido no filtro da tela.
// Não usa mais a view `academia_performance` (db/migrations/0001_init.sql) — ela não
// sabe de contatos_ajuste/conversoes_manual (migration 0002/0013), então deixaria de
// refletir correções/lançamentos manuais. Contatos usa o mesmo merge de
// fetch-funnel-counts.ts (ajuste substitui a contagem automática por academia+dia);
// conversões são a soma de Ane (automática, conversions) + manual (aditiva,
// manual_data.conversoes_manual + academias.conversoes_manual_ajuste_total).
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
      pool.query<{ id: string; nome: string; conversoes_manual_ajuste_total: number }>(
        scopedAcademiaId
          ? 'select id, nome, conversoes_manual_ajuste_total from academias where ativo = true and id = $1 order by nome'
          : 'select id, nome, conversoes_manual_ajuste_total from academias where ativo = true order by nome',
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
        conversoes_manual: number
      }>(
        `select academia_id, data, contatos_ajuste, conversoes_manual from manual_data
         where (contatos_ajuste is not null or conversoes_manual != 0)
           and ($1::uuid is null or academia_id = $1)
           and ($2::date is null or data >= $2)
           and ($3::date is null or data <= $3)`,
        [scopedAcademiaId, range?.fromDate ?? null, range?.toDate ?? null]
      ),
    ])

  // Contatos: contagem automática, com ajuste (substitui) quando existir pra
  // aquele academia+dia — mesmo merge de fetch-funnel-counts.ts.
  const effectiveContatos = new Map(contatosPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))
  for (const row of ajustes) {
    if (row.contatos_ajuste != null) effectiveContatos.set(keyOf(row.academia_id, row.data), row.contatos_ajuste)
  }

  const totalContatosByAcademia = new Map<string, number>()
  for (const [key, value] of effectiveContatos) {
    const id = key.split('|')[0]
    totalContatosByAcademia.set(id, (totalContatosByAcademia.get(id) ?? 0) + value)
  }

  // Conversões da Ane: contagem automática pura (conversions), sem merge de ajuste.
  const totalConversoesAneByAcademia = new Map<string, number>()
  for (const row of conversoesPorDia) {
    totalConversoesAneByAcademia.set(
      row.academia_id,
      (totalConversoesAneByAcademia.get(row.academia_id) ?? 0) + row.count
    )
  }

  // Conversões manuais: aditivo (soma dos lançamentos diários, não substitui nada).
  const totalConversoesManualByAcademia = new Map<string, number>()
  for (const row of ajustes) {
    totalConversoesManualByAcademia.set(
      row.academia_id,
      (totalConversoesManualByAcademia.get(row.academia_id) ?? 0) + row.conversoes_manual
    )
  }

  // conversoes_manual_ajuste_total não é preso a nenhum dia (diferente dos
  // lançamentos diários em manual_data), então só faz sentido somar na visão "Todo
  // período" — em qualquer filtro de data, um valor fixo "vazaria" pra dentro de um
  // intervalo que não tem nada a ver com ele.
  return academias.map((a) => {
    const conversoesManualAjusteTotal = period === 'todos' ? a.conversoes_manual_ajuste_total : 0
    const totalConversoesAne = totalConversoesAneByAcademia.get(a.id) ?? 0
    const totalConversoesManual = (totalConversoesManualByAcademia.get(a.id) ?? 0) + conversoesManualAjusteTotal
    return {
      academiaId: a.id,
      nome: a.nome,
      totalContatos: totalContatosByAcademia.get(a.id) ?? 0,
      totalConversoesAne,
      totalConversoesManual,
      totalConversoes: totalConversoesAne + totalConversoesManual,
      conversoesManualAjusteTotal,
    }
  })
}
