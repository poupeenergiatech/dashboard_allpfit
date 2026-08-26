import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { periodRange } from './period'

export type ClienteConvertidoDoMes = {
  id: string
  nome: string
  telefone: string | null
  // Status ATUAL do cliente (pode já ter saído de 'ativo' desde então — a
  // ativação continua contando no mês em que aconteceu, ver
  // fetch-financeiro-valor-mensal.ts: só a 1ª vez conta, pra sempre). Mostrado
  // aqui só pra dar contexto de "ainda é cliente ativo hoje ou não".
  statusAtual: string
  dataAtivacao: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Lista, pessoa a pessoa, quem compõe quantidadeConversoes/valorTotalCentavos de
// uma linha de financeiro_valor_mensal_unidade (ver fetch-financeiro-valor-mensal.ts)
// — é o "verificar os clientes convertidos daquele mês" do /financeiro, pra Super
// Admin conferir a conta em vez de confiar só no número. Mesma query (1ª ativação
// por cliente, dentro do mês) usada lá, pra bater 1:1 com o valor já exibido.
export async function fetchClientesConvertidosDoMes(
  profile: UserProfile,
  requestedAcademiaId: string,
  ano: number,
  mes: number
): Promise<ClienteConvertidoDoMes[]> {
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (!academiaId) {
    throw new Error('Sem permissão para ver os clientes convertidos dessa academia.')
  }

  const fromDate = `${ano}-${pad2(mes)}-01`
  const lastDay = new Date(ano, mes, 0).getDate()
  const toDate = `${ano}-${pad2(mes)}-${pad2(lastDay)}`
  const { from: fromTs, toExclusive } = periodRange('personalizado', { from: fromDate, to: toDate })

  const { rows } = await pool.query<{
    id: string
    nome: string
    telefone: string | null
    status_atual: string
    ativado_em: string
  }>(
    `select ca.id, ca.nome, ca.telefone, ca.status as status_atual, primeira_ativacao.ativado_em
     from (
       select cliente_alle_id, min(changed_at) as ativado_em
       from clientes_alle_status_history
       where status = 'ativo'
       group by cliente_alle_id
     ) primeira_ativacao
     join clientes_alle ca on ca.id = primeira_ativacao.cliente_alle_id
     where ca.academia_id = $1
       and primeira_ativacao.ativado_em >= $2
       and primeira_ativacao.ativado_em < $3
     order by primeira_ativacao.ativado_em asc`,
    [academiaId, fromTs, toExclusive]
  )

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    telefone: r.telefone,
    statusAtual: r.status_atual,
    dataAtivacao: r.ativado_em,
  }))
}
