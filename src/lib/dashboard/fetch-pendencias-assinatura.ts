import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'

export type PendenciaPorAcademia = {
  academiaId: string
  nome: string
  quantidade: number
  data: string | null
}

// Backlog atual por academia = última quantidade lançada manualmente (não soma
// pelo período — é um snapshot, não um contador de eventos do dia) + contagem de
// clientes com status 'pendente' em clientes_alle (nome próprio, ver
// fetch-clientes-alle.ts) — desde a migration 0016, que zerou o lançamento manual
// antigo pra essa soma não dobrar quem já tinha entrado como número solto. Academia
// sem nenhum lançamento manual ainda entra com esse pedaço 0 e data null.
//
// requestedAcademiaId vem do filtro de academia da tela (?academia=, ver page.tsx) —
// scopeAcademiaId ignora o valor pedido pra quem só enxerga a própria academia, então
// um coordenador não consegue ver outra unidade manipulando a URL.
export async function fetchPendenciasPorAcademia(
  profile: UserProfile,
  requestedAcademiaId?: string | null
): Promise<PendenciaPorAcademia[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const { rows } = await pool.query<{
    academia_id: string
    nome: string
    quantidade_manual: number | null
    clientes_pendentes: number
    data: string | null
  }>(
    `select a.id as academia_id, a.nome,
            (select pa.quantidade from pendencias_assinatura pa
             where pa.academia_id = a.id order by pa.data desc limit 1) as quantidade_manual,
            (select count(*) from clientes_alle ca
             where ca.academia_id = a.id and ca.status = 'pendente') as clientes_pendentes,
            (select pa.data from pendencias_assinatura pa
             where pa.academia_id = a.id order by pa.data desc limit 1) as data
     from academias a
     where a.ativo = true and ($1::uuid is null or a.id = $1)
     order by a.nome`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    academiaId: row.academia_id,
    nome: row.nome,
    quantidade: (row.quantidade_manual ?? 0) + row.clientes_pendentes,
    data: row.data,
  }))
}

export type PendenciaTrendPoint = {
  date: string
  quantidade: number
}

const TREND_DAYS = 30

// Soma diária (todas as academias no escopo, ou só a filtrada) dos últimos 30 dias,
// zero-preenchida nos dias sem lançamento — pra visualizar a evolução do backlog no
// tempo.
export async function fetchPendenciasTrend(
  profile: UserProfile,
  requestedAcademiaId?: string | null
): Promise<PendenciaTrendPoint[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const from = new Date()
  from.setDate(from.getDate() - (TREND_DAYS - 1))
  const fromDate = from.toISOString().slice(0, 10)

  const { rows } = await pool.query<{ data: string; total: number }>(
    `select data, sum(quantidade) as total
     from pendencias_assinatura
     where data >= $1 and ($2::uuid is null or academia_id = $2)
     group by data`,
    [fromDate, scopedAcademiaId]
  )

  const byDate = new Map(rows.map((r) => [r.data, r.total]))

  return Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date(from)
    date.setDate(date.getDate() + i)
    const iso = date.toISOString().slice(0, 10)
    return { date: iso, quantidade: byDate.get(iso) ?? 0 }
  })
}

export type PendenciaEntry = {
  id: string
  academiaId: string
  academiaNome: string
  data: string
  quantidade: number
}

const HISTORY_LIMIT = 90

export async function fetchPendenciasHistory(
  profile: UserProfile,
  requestedAcademiaId?: string | null
): Promise<PendenciaEntry[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const { rows } = await pool.query<{
    id: string
    academia_id: string
    academia_nome: string
    data: string
    quantidade: number
  }>(
    `select pa.id, pa.academia_id, a.nome as academia_nome, pa.data, pa.quantidade
     from pendencias_assinatura pa
     join academias a on a.id = pa.academia_id
     where ($1::uuid is null or pa.academia_id = $1)
     order by pa.data desc, a.nome asc
     limit $2`,
    [scopedAcademiaId, HISTORY_LIMIT]
  )

  return rows.map((row) => ({
    id: row.id,
    academiaId: row.academia_id,
    academiaNome: row.academia_nome,
    data: row.data,
    quantidade: row.quantidade,
  }))
}
