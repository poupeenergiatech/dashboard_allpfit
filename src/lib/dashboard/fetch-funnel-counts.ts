'use server'

import { pool } from '@/lib/db/pool'
import { getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'
import { periodRange } from './period'
import type { DailyFunnelPoint, DateRange, FunnelCounts, Period } from './types'

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
  period: Period,
  customRange?: DateRange | null
): Promise<FunnelCounts> {
  const profile = await getCurrentUserProfile()
  if (!profile) throw new Error('Sem sessão válida.')

  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  const { from, toExclusive, fromDate, toDate, days } = periodRange(period, customRange ?? undefined)

  const [
    { rows: academiaRows },
    { rows: academiaNomeRows },
    { rows: manualRows },
    { rows: contatosPorDia },
    { rows: conversoesPorDia },
    {
      rows: [{ count: clientesAlleCount }],
    },
  ] = await Promise.all([
      // total_alunos vem direto do cadastro da academia (não é mais um lançamento
      // diário em manual_data) — cadastra-se uma vez em /academias e o funil já
      // reflete em qualquer período, sem precisar relançar o mesmo número todo dia.
      // id/nome também saem daqui pra montar a base do breakdown de scans por
      // academia (scansPorAcademia): toda academia ATIVA aparece, mesmo com 0.
      pool.query<{ id: string; nome: string; total_alunos: number }>(
        `select id, nome, total_alunos from academias where ativo = true and ($1::uuid is null or id = $1)`,
        [academiaId]
      ),
      // Sem filtro de ativo: só pra resolver nome no breakdown de scans quando a
      // linha de manual_data é de uma academia já desativada (ex.: Recife) — sem
      // isso o detalhe por academia some com esses scans e a soma do breakdown
      // fica menor que o total exibido na coluna Scans.
      pool.query<{ id: string; nome: string }>(
        `select id, nome from academias where ($1::uuid is null or id = $1)`,
        [academiaId]
      ),
      pool.query<{
        academia_id: string
        data: string
        total_scans: number
        contatos_ajuste: number | null
        conversoes_manual: number
        reprovados: number
      }>(
        `select academia_id, data, total_scans, contatos_ajuste, conversoes_manual, reprovados
       from manual_data
       where data >= $1 and data <= $3 and ($2::uuid is null or academia_id = $2)`,
        [fromDate, academiaId, toDate]
      ),
      pool.query<{ academia_id: string; day: string; count: number }>(
        `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from contacts
       where created_at >= $1 and created_at < $3 and ($2::uuid is null or academia_id = $2)
       group by academia_id, day`,
        [from, academiaId, toExclusive]
      ),
      pool.query<{ academia_id: string; day: string; count: number }>(
        `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from conversions
       where created_at >= $1 and created_at < $3 and ($2::uuid is null or academia_id = $2)
       group by academia_id, day`,
        [from, academiaId, toExclusive]
      ),
      pool.query<{ count: number }>(
        `select count(*) from clientes_alle where status = 'ativo' and ($1::uuid is null or academia_id = $1)`,
        [academiaId]
      ),
    ])

  const totalAlunos = academiaRows.reduce((sum, row) => sum + (row.total_alunos ?? 0), 0)
  const academiaNomeById = new Map(academiaNomeRows.map((a) => [a.id, a.nome]))

  // total_scans é aditivo: soma direta de todas as linhas do período. reprovados e
  // conversoes_manual seguem o mesmo padrão (aditivo, sem substituir nenhuma contagem
  // automática — ver migration 0011 e 0013).
  let totalScans = 0
  let totalReprovados = 0
  let totalConversoesManual = 0

  // Por dia (pro histórico diário): soma bruta do que foi lançado naquele dia
  // específico, entre as academias no escopo.
  const scansPorDia = new Map<string, number>()
  const reprovadosPorDia = new Map<string, number>()
  const conversoesManualPorDia = new Map<string, number>()

  // Mesma soma, mas mantendo a identidade da academia — pra transparência no
  // histórico (dia X teve Y scans no total, sendo Z em cada unidade), já que o
  // filtro "todas" some com o detalhe por academia se só somarmos em scansPorDia.
  const scansPorAcademiaPorDia = new Map<string, Map<string, number>>()

  for (const row of manualRows) {
    totalScans += row.total_scans ?? 0
    scansPorDia.set(row.data, (scansPorDia.get(row.data) ?? 0) + (row.total_scans ?? 0))

    totalReprovados += row.reprovados ?? 0
    reprovadosPorDia.set(row.data, (reprovadosPorDia.get(row.data) ?? 0) + (row.reprovados ?? 0))

    totalConversoesManual += row.conversoes_manual ?? 0
    conversoesManualPorDia.set(row.data, (conversoesManualPorDia.get(row.data) ?? 0) + (row.conversoes_manual ?? 0))

    const porAcademia = scansPorAcademiaPorDia.get(row.data) ?? new Map<string, number>()
    porAcademia.set(row.academia_id, (porAcademia.get(row.academia_id) ?? 0) + (row.total_scans ?? 0))
    scansPorAcademiaPorDia.set(row.data, porAcademia)
  }

  // Contatos: por padrão é a contagem automática (contacts, por academia+dia); quando
  // existe um ajuste manual pra aquele academia+dia (ver migration 0002), ele substitui
  // a contagem automática por completo — não soma em cima. O merge é por chave
  // academia_id+dia pra um ajuste não "vazar" pra outra academia quando o filtro é
  // "todas". Conversões da Ane (conversions) não têm mais esse merge — são só a
  // contagem automática, exposta separadamente de conversoes_manual (acima).
  const rawContatos = new Map(contatosPorDia.map((r) => [keyOf(r.academia_id, r.day), r.count]))
  const effectiveContatos = new Map(rawContatos)

  for (const row of manualRows) {
    const key = keyOf(row.academia_id, row.data)
    if (row.contatos_ajuste != null) effectiveContatos.set(key, row.contatos_ajuste)
  }

  let totalContatos = 0
  let totalConversoesAne = 0
  const contatosPorDiaEfetivo = new Map<string, number>()
  const conversoesAnePorDia = new Map<string, number>()

  for (const [key, value] of effectiveContatos) {
    const day = key.split('|')[1]
    totalContatos += value
    contatosPorDiaEfetivo.set(day, (contatosPorDiaEfetivo.get(day) ?? 0) + value)
  }
  for (const row of conversoesPorDia) {
    totalConversoesAne += row.count
    conversoesAnePorDia.set(row.day, (conversoesAnePorDia.get(row.day) ?? 0) + row.count)
  }

  const totalConversoes = totalConversoesAne + totalConversoesManual
  const totalClientesAlle = clientesAlleCount

  // totalAlunos não varia por dia (é o total cadastrado agora, não um lançamento
  // histórico) — repete o mesmo valor em cada ponto da série.
  const series: DailyFunnelPoint[] = enumerateDays(fromDate, days).map((date) => {
    const conversoesAne = conversoesAnePorDia.get(date) ?? 0
    const conversoesManual = conversoesManualPorDia.get(date) ?? 0
    return {
    date,
    totalAlunos,
    totalScans: scansPorDia.get(date) ?? 0,
    contatos: contatosPorDiaEfetivo.get(date) ?? 0,
    conversoesAne,
    conversoesManual,
    conversoes: conversoesAne + conversoesManual,
    reprovados: reprovadosPorDia.get(date) ?? 0,
    // Toda academia ativa aparece, mesmo com 0 — é isso que deixa claro quem não
    // reportou scan nenhum naquele dia. Some a isso qualquer academia_id que só
    // aparece em manual_data (ex.: desativada depois do lançamento) — sem isso a
    // soma do breakdown ficaria menor que o total da coluna Scans daquele dia.
    scansPorAcademia: (() => {
      const idsDoDia = new Set(academiaRows.map((a) => a.id))
      for (const id of scansPorAcademiaPorDia.get(date)?.keys() ?? []) idsDoDia.add(id)
      return Array.from(idsDoDia).map((id) => ({
        academiaId: id,
        academiaNome: academiaNomeById.get(id) ?? '(academia removida)',
        totalScans: scansPorAcademiaPorDia.get(date)?.get(id) ?? 0,
      }))
    })(),
    }
  })

  return {
    totalAlunos,
    totalScans,
    totalContatos,
    totalConversoesAne,
    totalConversoesManual,
    totalConversoes,
    totalReprovados,
    totalClientesAlle,
    series,
  }
}
