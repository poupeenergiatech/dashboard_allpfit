import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { fetchAcademiaPerformance } from './fetch-academia-performance'
import { VALOR_POR_CONVERSAO_CENTAVOS, type ValorMensalUnidade } from './financeiro-valor-mensal'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function monthBounds(ano: number, mes: number): { from: string; to: string } {
  const from = `${ano}-${pad2(mes)}-01`
  const lastDay = new Date(ano, mes, 0).getDate()
  const to = `${ano}-${pad2(mes)}-${pad2(lastDay)}`
  return { from, to }
}

// Recalcula (upsert) o valor mensal de cada academia no escopo do profile, pra um
// ano/mês específico — reusa fetchAcademiaPerformance (mesma contagem de conversões
// Ane + manual do resto do app), escopado só pro intervalo daquele mês, nunca o
// histórico inteiro (é isso que torna o cálculo "único a cada mês").
async function recalcularMes(profile: UserProfile, ano: number, mes: number): Promise<void> {
  const { from, to } = monthBounds(ano, mes)
  const performance = await fetchAcademiaPerformance(profile, 'personalizado', { from, to })

  await Promise.all(
    performance.map((academia) => {
      const valorTotalCentavos = academia.totalConversoes * VALOR_POR_CONVERSAO_CENTAVOS
      return pool.query(
        `insert into financeiro_valor_mensal_unidade
           (academia_id, competencia_ano, competencia_mes, quantidade_conversoes, valor_por_conversao_centavos, valor_total_centavos, calculado_em)
         values ($1, $2, $3, $4, $5, $6, now())
         on conflict (academia_id, competencia_ano, competencia_mes)
         do update set
           quantidade_conversoes = excluded.quantidade_conversoes,
           valor_por_conversao_centavos = excluded.valor_por_conversao_centavos,
           valor_total_centavos = excluded.valor_total_centavos,
           calculado_em = excluded.calculado_em`,
        [academia.academiaId, ano, mes, academia.totalConversoes, VALOR_POR_CONVERSAO_CENTAVOS, valorTotalCentavos]
      )
    })
  )
}

// Início da série histórica: antes de julho/2026 os dados de conversão por
// academia+mês eram inconsistentes (valores "estranhos" reportados em produção
// remetendo a set/2025), então em vez de uma janela rolante de N meses pra trás,
// a série sempre começa nessa âncora fixa e cresce mês a mês a partir dela — mês
// atual em diante, nunca antes.
const ANO_INICIO_HISTORICO = 2026
const MES_INICIO_HISTORICO = 7

// Da âncora (ano/mês acima) até o mês corrente, inclusive nas duas pontas, mais
// antigo primeiro.
function mesesDesdeAncora(): { ano: number; mes: number }[] {
  const now = new Date()
  const anoAtual = now.getFullYear()
  const mesAtual = now.getMonth() + 1

  const meses: { ano: number; mes: number }[] = []
  let ano = ANO_INICIO_HISTORICO
  let mes = MES_INICIO_HISTORICO
  while (ano < anoAtual || (ano === anoAtual && mes <= mesAtual)) {
    meses.push({ ano, mes })
    mes++
    if (mes > 12) {
      mes = 1
      ano++
    }
  }
  return meses
}

// Recalcula todo mês desde a âncora até o corrente (em paralelo — cada mês é
// independente) e devolve o histórico já atualizado, mais antigo primeiro,
// agrupável por academia ou por competência no componente que consome. Chamado a
// cada carregamento de /financeiro: sem isso o histórico nunca apareceria na
// primeira visita (tabela nasce vazia) nem refletiria uma correção feita depois
// numa conversão de um mês já fechado.
export async function fetchHistoricoValorMensal(profile: UserProfile): Promise<ValorMensalUnidade[]> {
  const targets = mesesDesdeAncora()
  await Promise.all(targets.map(({ ano, mes }) => recalcularMes(profile, ano, mes)))

  const scopedAcademiaId = scopeAcademiaId(profile, null)
  const competenciaMinima = ANO_INICIO_HISTORICO * 100 + MES_INICIO_HISTORICO

  const { rows } = await pool.query<{
    academia_id: string
    academia_nome: string
    competencia_ano: number
    competencia_mes: number
    quantidade_conversoes: number
    valor_por_conversao_centavos: number
    valor_total_centavos: number
    calculado_em: string
  }>(
    `select v.academia_id, a.nome as academia_nome, v.competencia_ano, v.competencia_mes,
            v.quantidade_conversoes, v.valor_por_conversao_centavos, v.valor_total_centavos, v.calculado_em
     from financeiro_valor_mensal_unidade v
     join academias a on a.id = v.academia_id
     where ($1::uuid is null or v.academia_id = $1)
       and a.ativo = true
       and (v.competencia_ano * 100 + v.competencia_mes) >= $2
     order by a.nome, v.competencia_ano, v.competencia_mes`,
    [scopedAcademiaId, competenciaMinima]
  )

  return rows.map((r) => ({
    academiaId: r.academia_id,
    academiaNome: r.academia_nome,
    ano: r.competencia_ano,
    mes: r.competencia_mes,
    quantidadeConversoes: r.quantidade_conversoes,
    valorPorConversaoCentavos: r.valor_por_conversao_centavos,
    valorTotalCentavos: r.valor_total_centavos,
    calculadoEm: r.calculado_em,
  }))
}
