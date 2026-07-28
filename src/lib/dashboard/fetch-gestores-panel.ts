'use server'

import { pool } from '@/lib/db/pool'
import { canAccessPainelGestores, getCurrentUserProfile } from '@/lib/auth/profile'
import { fetchConversaoStatusesIncluidos } from './fetch-conversao-status-settings'
import { periodRange } from './period'
import type { DateRange, Period } from './types'

export type GestoresPanelPeriod = Period | 'todos'

export type GestoresPanelRow = {
  academiaId: string
  nome: string
  totalAlunos: number
  totalContatos: number
  totalScansPeriodo: number
  totalScansHoje: number
  totalConversoesAne: number
  totalConversoesManual: number
  totalConversoes: number
  // Superset de AcademiaPerformance (fetch-academia-performance.ts) — inclui esse
  // campo só pra poder reaproveitar AcademiaPerformanceChart aqui direto, sem
  // adaptar as linhas. Não aparece em nenhum card/coluna própria do painel.
  conversoesManualAjusteTotal: number
  clientesAlleAtivos: number
  treinada: boolean
  pendentesAssinatura: number
}

export type GestoresPanelData = {
  days: number | null
  rows: GestoresPanelRow[]
  totals: {
    totalScansPeriodo: number
    totalScansHoje: number
    totalConversoes: number
    clientesAlleAtivos: number
    pendentesAssinatura: number
    academiasTreinadas: number
    academiasTotal: number
  }
}

function keyOf(academiaId: string, day: string): string {
  return `${academiaId}|${day}`
}

// Chamada como Server Action direto do hook client (use-gestores-panel-data.ts) —
// diferente de fetchFunnelCounts/fetchAcademiaPerformance, NUNCA escopa por
// academia: o painel é justamente um placar entre todas as unidades (ver
// canAccessPainelGestores), então quem tem acesso enxerga a lista inteira. A
// checagem de role abaixo é a barreira real (sem RLS) — sem ela, qualquer sessão
// autenticada poderia chamar essa action direto do bundle do client e ler dados de
// academias que não são a sua.
export async function fetchGestoresPanel(
  period: GestoresPanelPeriod,
  customRange?: DateRange | null,
  requestedAcademiaId?: string | null
): Promise<GestoresPanelData> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canAccessPainelGestores(profile.role)) {
    throw new Error('Sem permissão para ver o Painel de Gestores.')
  }

  // Filtro de UI, não de segurança: diferente de scopeAcademiaId (usado nas
  // outras telas pra restringir quem só enxerga a própria academia), aqui quem
  // tem acesso já vê todas as unidades por definição (ver
  // canAccessPainelGestores) — academiaId só estreita a visão pra quem quer
  // focar numa unidade específica sem perder o resto do painel.
  const academiaId = requestedAcademiaId ?? null

  const range = period === 'todos' ? null : periodRange(period, customRange ?? undefined)
  const hoje = periodRange('hoje')
  const statusesConversao = await fetchConversaoStatusesIncluidos()

  const [
    { rows: academias },
    { rows: contatosPorDia },
    { rows: conversoesPorDia },
    { rows: manualPeriodo },
    { rows: manualHoje },
    { rows: clientesAtivos },
    { rows: treinadas },
    { rows: pendentes },
  ] = await Promise.all([
    pool.query<{ id: string; nome: string; total_alunos: number; conversoes_manual_ajuste_total: number }>(
      `select id, nome, total_alunos, conversoes_manual_ajuste_total from academias
       where ativo = true and ($1::uuid is null or id = $1)
       order by nome`,
      [academiaId]
    ),
    pool.query<{ academia_id: string; day: string; count: number }>(
      `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from contacts
       where ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)
         and ($3::uuid is null or academia_id = $3)
       group by academia_id, day`,
      [range?.from ?? null, range?.toExclusive ?? null, academiaId]
    ),
    pool.query<{ academia_id: string; day: string; count: number }>(
      `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from conversions
       where ($1::timestamptz is null or created_at >= $1) and ($2::timestamptz is null or created_at < $2)
         and ($3::uuid is null or academia_id = $3)
       group by academia_id, day`,
      [range?.from ?? null, range?.toExclusive ?? null, academiaId]
    ),
    pool.query<{
      academia_id: string
      data: string
      contatos_ajuste: number | null
      conversoes_manual: number
      total_scans: number
    }>(
      `select academia_id, data, contatos_ajuste, conversoes_manual, total_scans from manual_data
       where ($1::date is null or data >= $1) and ($2::date is null or data <= $2)
         and ($3::uuid is null or academia_id = $3)`,
      [range?.fromDate ?? null, range?.toDate ?? null, academiaId]
    ),
    // Scans "de hoje" ficam fixos no dia corrente, independente do período
    // selecionado no filtro — é a referência rápida que o gestor quer bater o olho
    // e comparar com o total do período ao lado, no mesmo gráfico.
    pool.query<{ academia_id: string; total_scans: number }>(
      `select academia_id, total_scans from manual_data
       where data = $1 and ($2::uuid is null or academia_id = $2)`,
      [hoje.fromDate, academiaId]
    ),
    // `total` é o headcount real de ATIVOS (exibido como "Clientes Alle ativos"
    // no painel — quem não assinou o termo ainda não entra aqui). `exclusivo` é
    // outra coisa: quem converteu por fora do Ane com um dos status habilitados
    // em /configuracoes (ver fetchConversaoStatusesIncluidos — ativo/pendente/
    // reprovado sempre contam, sem_informacao/com_impedimentos/falta_documentos
    // só se ligado) e ainda não tem uma linha em conversions apontando pra cá
    // (cliente_alle_id, criada ao marcar o termo de adesão em /convertidos via
    // definirStatusClienteConvertido). Só `exclusivo` entra em
    // totalConversoesManual (ver abaixo) — somar `total` ali contava essa pessoa
    // duas vezes (uma em totalConversoesAne, outra aqui).
    pool.query<{ academia_id: string; total: number; exclusivo: number }>(
      `select ca.academia_id,
              count(*) filter (where ca.status = 'ativo') as total,
              count(*) filter (
                where ca.status = any($1::text[])
                  and not exists (select 1 from conversions c2 where c2.cliente_alle_id = ca.id)
              ) as exclusivo
       from clientes_alle ca
       where ($2::uuid is null or ca.academia_id = $2)
       group by ca.academia_id`,
      [statusesConversao, academiaId]
    ),
    pool.query<{ academia_id: string; treinada: boolean | null }>(
      `select academia_id, treinada from trained_academias where ($1::uuid is null or academia_id = $1)`,
      [academiaId]
    ),
    // Mesma composição de fetch-pendencias-assinatura.ts: último lançamento manual
    // (snapshot, não soma por período) + clientes com termo de adesão pendente.
    pool.query<{ academia_id: string; quantidade_manual: number | null; clientes_pendentes: number }>(
      `select a.id as academia_id,
              (select pa.quantidade from pendencias_assinatura pa
               where pa.academia_id = a.id order by pa.data desc limit 1) as quantidade_manual,
              (select count(*) from clientes_alle ca
               where ca.academia_id = a.id and ca.status = 'pendente') as clientes_pendentes
       from academias a
       where a.ativo = true and ($1::uuid is null or a.id = $1)`,
      [academiaId]
    ),
  ])

  const effectiveContatos = new Map(contatosPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))
  for (const row of manualPeriodo) {
    if (row.contatos_ajuste != null) effectiveContatos.set(keyOf(row.academia_id, row.data), row.contatos_ajuste)
  }
  const totalContatosByAcademia = new Map<string, number>()
  for (const [key, value] of effectiveContatos) {
    const id = key.split('|')[0]
    totalContatosByAcademia.set(id, (totalContatosByAcademia.get(id) ?? 0) + value)
  }

  const totalConversoesAneByAcademia = new Map<string, number>()
  for (const row of conversoesPorDia) {
    totalConversoesAneByAcademia.set(row.academia_id, (totalConversoesAneByAcademia.get(row.academia_id) ?? 0) + row.count)
  }

  const totalConversoesManualLancadoByAcademia = new Map<string, number>()
  const totalScansPeriodoByAcademia = new Map<string, number>()
  for (const row of manualPeriodo) {
    totalConversoesManualLancadoByAcademia.set(
      row.academia_id,
      (totalConversoesManualLancadoByAcademia.get(row.academia_id) ?? 0) + row.conversoes_manual
    )
    totalScansPeriodoByAcademia.set(
      row.academia_id,
      (totalScansPeriodoByAcademia.get(row.academia_id) ?? 0) + (row.total_scans ?? 0)
    )
  }

  const totalScansHojeByAcademia = new Map(manualHoje.map((r) => [r.academia_id, r.total_scans ?? 0]))
  const clientesAtivosByAcademia = new Map(clientesAtivos.map((r) => [r.academia_id, r.total]))
  const clientesAtivosExclusivosByAcademia = new Map(clientesAtivos.map((r) => [r.academia_id, r.exclusivo]))
  const treinadaByAcademia = new Map(treinadas.map((r) => [r.academia_id, r.treinada ?? false]))
  const pendentesByAcademia = new Map(
    pendentes.map((r) => [r.academia_id, (r.quantidade_manual ?? 0) + r.clientes_pendentes])
  )

  const rows: GestoresPanelRow[] = academias.map((a) => {
    // conversoes_manual_ajuste_total não tem data própria (não é um lançamento
    // diário) — só entra na soma na visão "Todo período", mesma regra de
    // fetch-academia-performance.ts.
    const ajusteTotal = period === 'todos' ? a.conversoes_manual_ajuste_total : 0
    const totalConversoesAne = totalConversoesAneByAcademia.get(a.id) ?? 0
    const totalConversoesManual =
      (totalConversoesManualLancadoByAcademia.get(a.id) ?? 0) +
      ajusteTotal +
      (clientesAtivosExclusivosByAcademia.get(a.id) ?? 0)

    return {
      academiaId: a.id,
      nome: a.nome,
      totalAlunos: a.total_alunos ?? 0,
      totalContatos: totalContatosByAcademia.get(a.id) ?? 0,
      totalScansPeriodo: totalScansPeriodoByAcademia.get(a.id) ?? 0,
      totalScansHoje: totalScansHojeByAcademia.get(a.id) ?? 0,
      totalConversoesAne,
      totalConversoesManual,
      totalConversoes: totalConversoesAne + totalConversoesManual,
      conversoesManualAjusteTotal: ajusteTotal,
      clientesAlleAtivos: clientesAtivosByAcademia.get(a.id) ?? 0,
      treinada: treinadaByAcademia.get(a.id) ?? false,
      pendentesAssinatura: pendentesByAcademia.get(a.id) ?? 0,
    }
  })

  rows.sort((a, b) => b.totalConversoes - a.totalConversoes)

  const totals = rows.reduce(
    (acc, r) => ({
      totalScansPeriodo: acc.totalScansPeriodo + r.totalScansPeriodo,
      totalScansHoje: acc.totalScansHoje + r.totalScansHoje,
      totalConversoes: acc.totalConversoes + r.totalConversoes,
      clientesAlleAtivos: acc.clientesAlleAtivos + r.clientesAlleAtivos,
      pendentesAssinatura: acc.pendentesAssinatura + r.pendentesAssinatura,
      academiasTreinadas: acc.academiasTreinadas + (r.treinada ? 1 : 0),
      academiasTotal: acc.academiasTotal + 1,
    }),
    {
      totalScansPeriodo: 0,
      totalScansHoje: 0,
      totalConversoes: 0,
      clientesAlleAtivos: 0,
      pendentesAssinatura: 0,
      academiasTreinadas: 0,
      academiasTotal: 0,
    }
  )

  return { days: range?.days ?? null, rows, totals }
}
