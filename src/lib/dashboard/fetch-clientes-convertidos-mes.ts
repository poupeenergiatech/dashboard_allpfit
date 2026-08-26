import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { fetchConversaoStatusesIncluidos } from './fetch-conversao-status-settings'
import { periodRange } from './period'

export type ClienteConvertidoDoMesOrigem = 'ane' | 'manual'

export type ClienteConvertidoDoMes = {
  id: string
  origem: ClienteConvertidoDoMesOrigem
  nome: string | null
  telefone: string | null
  status: string | null
  dataConversao: string
}

// Lançamento manual agregado por dia (manual_data.conversoes_manual) — soma diária
// sem nome de cliente por linha (diferente de clientes_alle, que é um cadastro por
// pessoa). Entra na conta de totalConversoes (fetch-academia-performance.ts) mas não
// dá pra listar pessoa a pessoa: só dá pra mostrar quantidade + dia do lançamento.
export type LancamentoManualSemNome = {
  data: string
  quantidade: number
}

export type ClientesConvertidosDoMes = {
  clientes: ClienteConvertidoDoMes[]
  lancamentosManuaisSemNome: LancamentoManualSemNome[]
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Detalha, pessoa a pessoa (mais os lançamentos agregados sem nome, à parte), quem
// compõe `quantidadeConversoes`/`valorTotalCentavos` de uma linha de
// financeiro_valor_mensal_unidade (ver fetch-financeiro-valor-mensal.ts) — é o
// "verificar os clientes convertidos daquele mês" do /financeiro, pra Super Admin
// conferir a conta em vez de confiar só no número. Espelha exatamente as três fontes
// somadas em totalConversoes (fetch-academia-performance.ts), pra reconciliar 1:1 com
// o valor já exibido (clientes.length + soma de lancamentosManuaisSemNome):
// - 'ane': linhas de `conversions` da academia, datadas por created_at dentro do mês.
// - 'manual': clientes_alle "exclusivo" (status contado como conversão E sem vínculo
//   em conversions), também datado por created_at dentro do mês — mesmo filtro que
//   corrige o vazamento em fetch-academia-performance.ts.
// - lançamentos manuais agregados (manual_data.conversoes_manual, datado por `data`)
//   — sem nome de cliente, por isso à parte em vez de misturado na lista de pessoas.
// Fora daqui de propósito: conversoes_manual_ajuste_total (ajuste histórico fixo,
// sem data nem pessoa — e sempre 0 no cálculo mensal do financeiro, só conta na
// visão "todo período" de outras telas).
export async function fetchClientesConvertidosDoMes(
  profile: UserProfile,
  requestedAcademiaId: string,
  ano: number,
  mes: number
): Promise<ClientesConvertidosDoMes> {
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (!academiaId) {
    throw new Error('Sem permissão para ver os clientes convertidos dessa academia.')
  }

  const fromDate = `${ano}-${pad2(mes)}-01`
  const lastDay = new Date(ano, mes, 0).getDate()
  const toDate = `${ano}-${pad2(mes)}-${pad2(lastDay)}`
  const { from: fromTs, toExclusive } = periodRange('personalizado', { from: fromDate, to: toDate })

  const statusesConversao = await fetchConversaoStatusesIncluidos()

  const [{ rows: pessoas }, { rows: lancamentos }] = await Promise.all([
    pool.query<{
      id: string
      origem: ClienteConvertidoDoMesOrigem
      nome: string | null
      telefone: string | null
      status: string | null
      data_conversao: string
    }>(
      `select c.id, 'ane' as origem, c.nome, c.telefone, c.status, c.created_at as data_conversao
       from conversions c
       where c.academia_id = $1 and c.created_at >= $2 and c.created_at < $3
       union all
       select ca.id, 'manual' as origem, ca.nome, ca.telefone, ca.status, ca.created_at as data_conversao
       from clientes_alle ca
       where ca.academia_id = $1
         and ca.status = any($4::text[])
         and not exists (select 1 from conversions c2 where c2.cliente_alle_id = ca.id)
         and ca.created_at >= $2 and ca.created_at < $3
       order by data_conversao asc`,
      [academiaId, fromTs, toExclusive, statusesConversao]
    ),
    // Mesmo escopo de data que a linha `ajustes` usa em fetch-academia-performance.ts
    // (data, tipo date, >= fromDate/<= toDate — não timestamptz).
    pool.query<{ data: string; conversoes_manual: number }>(
      `select data, conversoes_manual from manual_data
       where academia_id = $1 and conversoes_manual != 0 and data >= $2 and data <= $3
       order by data asc`,
      [academiaId, fromDate, toDate]
    ),
  ])

  return {
    clientes: pessoas.map((r) => ({
      id: r.id,
      origem: r.origem,
      nome: r.nome,
      telefone: r.telefone,
      status: r.status,
      dataConversao: r.data_conversao,
    })),
    lancamentosManuaisSemNome: lancamentos.map((r) => ({ data: r.data, quantidade: r.conversoes_manual })),
  }
}
