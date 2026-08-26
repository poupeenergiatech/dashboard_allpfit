import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { fetchConversaoStatusesIncluidos } from './fetch-conversao-status-settings'
import { fetchPendenciasPorAcademia } from './fetch-pendencias-assinatura'
import { periodRange } from './period'
import type { DateRange, Period } from './types'

export type AcademiaPerformance = {
  academiaId: string
  nome: string
  totalAlunos: number
  totalContatos: number
  totalConversoesAne: number
  totalConversoesManual: number
  totalConversoes: number
  conversoesManualAjusteTotal: number
  clientesAlleAtivos: number
  pendentesAssinatura: number
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
  const statusesConversao = await fetchConversaoStatusesIncluidos()

  const [
    { rows: academias },
    { rows: contatosPorDia },
    { rows: conversoesPorDia },
    { rows: ajustes },
    { rows: clientesAlleAtivos },
    pendenciasPorAcademia,
  ] = await Promise.all([
      pool.query<{ id: string; nome: string; total_alunos: number; conversoes_manual_ajuste_total: number }>(
        scopedAcademiaId
          ? 'select id, nome, total_alunos, conversoes_manual_ajuste_total from academias where ativo = true and id = $1 order by nome'
          : 'select id, nome, total_alunos, conversoes_manual_ajuste_total from academias where ativo = true order by nome',
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
      // `total` é o headcount real de ATIVOS (exibido na coluna "Clientes Alle
      // ativos" — quem não assinou o termo ainda, ex. status 'pendente', não entra
      // aqui) — sem filtro de data de propósito, é uma foto do estado atual, igual
      // ao card "Clientes Alle" (ver fetch-funnel-counts.ts).
      // `exclusivo` é outra coisa: quem converteu por fora do Ane com um dos
      // status habilitados em /configuracoes (ver fetchConversaoStatusesIncluidos
      // — ativo/pendente/reprovado sempre contam, sem_informacao/com_impedimentos/
      // falta_documentos só se ligado) E ainda não tem uma linha em conversions
      // apontando pra cá (cliente_alle_id) — o caminho de "marcar termo de
      // adesão" em /convertidos (definirStatusClienteConvertido, ver actions.ts)
      // cria/vincula um clientes_alle a partir de uma conversão Ane já existente,
      // e essa pessoa já está contada em totalConversoesAne. Só `exclusivo` entra
      // em totalConversoesManual — por isso, diferente de `total`, `exclusivo` É
      // escopado por `created_at` (data de cadastro em clientes_alle, mais perto
      // que temos de "data da conversão" pra quem entrou fora do Ane) quando o
      // período não for "todos". Mesmo padrão já usado em fetch-gestores-panel.ts.
      // Sem isso, cada cliente exclusivo contava em TODO mês recalculado por
      // /financeiro (fetchHistoricoValorMensal chama esta função uma vez por mês
      // da série) em vez de só no mês em que entrou — inflava o valor de todos os
      // meses igualmente.
      pool.query<{ academia_id: string; total: number; exclusivo: number }>(
        `select ca.academia_id,
                count(*) filter (where ca.status = 'ativo') as total,
                count(*) filter (
                  where ca.status = any($2::text[])
                    and not exists (select 1 from conversions c2 where c2.cliente_alle_id = ca.id)
                    and ($3::timestamptz is null or ca.created_at >= $3)
                    and ($4::timestamptz is null or ca.created_at < $4)
                ) as exclusivo
         from clientes_alle ca
         where ($1::uuid is null or ca.academia_id = $1)
         group by ca.academia_id`,
        [scopedAcademiaId, statusesConversao, range?.from ?? null, range?.toExclusive ?? null]
      ),
      // Mesma composição de fetch-pendencias-assinatura.ts (backlog atual, não soma
      // por período): último lançamento manual + clientes com termo de adesão
      // pendente. Reusa a função em vez de duplicar a query aqui.
      fetchPendenciasPorAcademia(profile, scopedAcademiaId),
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
  const clientesAlleAtivosByAcademia = new Map(clientesAlleAtivos.map((r) => [r.academia_id, r.total]))
  const clientesAlleExclusivosByAcademia = new Map(clientesAlleAtivos.map((r) => [r.academia_id, r.exclusivo]))
  const pendentesByAcademia = new Map(pendenciasPorAcademia.map((r) => [r.academiaId, r.quantidade]))

  return academias.map((a) => {
    const conversoesManualAjusteTotal = period === 'todos' ? a.conversoes_manual_ajuste_total : 0
    const totalConversoesAne = totalConversoesAneByAcademia.get(a.id) ?? 0
    const totalConversoesManual =
      (totalConversoesManualByAcademia.get(a.id) ?? 0) +
      conversoesManualAjusteTotal +
      (clientesAlleExclusivosByAcademia.get(a.id) ?? 0)
    return {
      academiaId: a.id,
      nome: a.nome,
      totalAlunos: a.total_alunos ?? 0,
      totalContatos: totalContatosByAcademia.get(a.id) ?? 0,
      totalConversoesAne,
      totalConversoesManual,
      totalConversoes: totalConversoesAne + totalConversoesManual,
      conversoesManualAjusteTotal,
      clientesAlleAtivos: clientesAlleAtivosByAcademia.get(a.id) ?? 0,
      pendentesAssinatura: pendentesByAcademia.get(a.id) ?? 0,
    }
  })
}
