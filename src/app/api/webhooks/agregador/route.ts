import { NextResponse, type NextRequest } from 'next/server'
import { parseDateTimeBR } from '@/lib/dashboard/date-br'
import { pool } from '@/lib/db/pool'
import { buildAcademiaNomeResolver } from '@/lib/dashboard/resolve-academia-by-nome'

export const dynamic = 'force-dynamic'

// Endpoint de entrada configurado no sistema agregador — ele chama isso 1x por dia com o
// lote de contatos novos, no mesmo formato do relatório que /api/relatorio envia (o
// agregador reusa o contrato). Ver docs/SPRINT7_NOTES.md para o payload de exemplo.
//
// Casamento com a academia: "academia" (nome da unidade) é o identificador primário desde
// que o agregador passou a mandá-lo sempre preenchido — mesmo resolvedor nome→id do sync
// Alle Documentos (normalizeNome/normalizeNomeLoose/academia_aliases, ver
// resolve-academia-by-nome.ts), porque telefone_numero sozinho não desambigua quando duas
// academias compartilham o mesmo número de WhatsApp (ver /numeros). telefone_numero só
// entra como fallback se o nome não bater com nada.
type IncomingContato = {
  nome?: unknown
  telefone?: unknown
  recebido_em?: unknown
}

type IncomingAcademia = {
  academia?: unknown
  telefone_numero?: unknown
  contatos?: unknown
}

type IncomingPayload = {
  data_relatorio?: unknown
  por_academia?: unknown
}

type ContactRow = {
  nome: string
  telefone: string | null
  academia_id: string
  created_at: string
}

type DistribuicaoEntry = {
  academia_label: string | null
  telefone_numero: string | null
  academia_id: string | null
  academia_nome: string | null
  matched_by: 'nome' | 'telefone' | null
  contatos_recebidos: number
  contatos_inseridos: number
  contatos_ignorados: number
}

// Uma linha por chamada autenticada (payload malformado, erro de gravação ou sucesso) —
// alimenta o "Histórico de payloads" em /configuracoes. Não loga 401/503: nesses casos não
// houve payload de fato processado, só uma tentativa sem credencial válida.
async function logWebhookCall(entry: {
  status: 'sucesso' | 'erro'
  payload: unknown
  distribuicao: DistribuicaoEntry[]
  totalRecebido: number | null
  totalInserido: number | null
  totalIgnorado: number | null
  academiasNaoEncontradas: string[]
  errorMessage: string | null
}) {
  await pool.query(
    `insert into agregador_webhook_log
       (status, payload, distribuicao, total_recebido, total_inserido, total_ignorado, academias_nao_encontradas, error_message)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      entry.status,
      entry.payload === undefined ? null : JSON.stringify(entry.payload),
      JSON.stringify(entry.distribuicao),
      entry.totalRecebido,
      entry.totalInserido,
      entry.totalIgnorado,
      JSON.stringify(entry.academiasNaoEncontradas),
      entry.errorMessage,
    ]
  )
}

export async function POST(request: NextRequest) {
  const secret = process.env.AGREGADOR_WEBHOOK_SECRET
  if (!secret) {
    // Diferente do CRON_SECRET (protege um trigger que só executa uma ação que já exige
    // outra credencial pra ter efeito visível), esse endpoint GRAVA dados vindos de fora —
    // sem segredo configurado, aceitar a chamada seria deixar qualquer um injetar contatos
    // falsos. Recusa por padrão em vez de "funcionar sem checagem" como o /api/relatorio faz.
    return NextResponse.json({ error: 'AGREGADOR_WEBHOOK_SECRET não configurado no servidor.' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let rawBody: unknown
  let payload: IncomingPayload
  try {
    rawBody = await request.json()
    payload = rawBody as IncomingPayload
  } catch {
    await logWebhookCall({
      status: 'erro',
      payload: null,
      distribuicao: [],
      totalRecebido: null,
      totalInserido: null,
      totalIgnorado: null,
      academiasNaoEncontradas: [],
      errorMessage: 'Corpo da requisição não é um JSON válido.',
    })
    return NextResponse.json({ error: 'Corpo da requisição não é um JSON válido.' }, { status: 400 })
  }

  if (!Array.isArray(payload.por_academia)) {
    await logWebhookCall({
      status: 'erro',
      payload: rawBody,
      distribuicao: [],
      totalRecebido: null,
      totalInserido: null,
      totalIgnorado: null,
      academiasNaoEncontradas: [],
      errorMessage: '"por_academia" é obrigatório e deve ser uma lista.',
    })
    return NextResponse.json({ error: '"por_academia" é obrigatório e deve ser uma lista.' }, { status: 400 })
  }

  const [{ rows: academias }, { rows: aliases }] = await Promise.all([
    pool.query<{ id: string; nome: string; numero_telefone: string | null }>(
      'select id, nome, numero_telefone from academias'
    ),
    pool.query<{ alias_nome: string; academia_id: string }>('select alias_nome, academia_id from academia_aliases'),
  ])
  const academiaById = new Map(academias.map((a) => [a.id, a]))
  const academiaByPhone = new Map(academias.map((a) => [a.numero_telefone, a]))
  const resolveAcademiaIdByNome = buildAcademiaNomeResolver(academias, aliases)

  const rows: ContactRow[] = []
  const distribuicao: DistribuicaoEntry[] = []
  const academiasNaoEncontradas: string[] = []
  let contatosIgnorados = 0

  for (const entry of payload.por_academia as IncomingAcademia[]) {
    const academiaLabel = typeof entry.academia === 'string' ? entry.academia : null
    const telefoneNumero = typeof entry.telefone_numero === 'string' ? entry.telefone_numero : null
    const contatos = Array.isArray(entry.contatos) ? (entry.contatos as IncomingContato[]) : []

    let academia = academiaLabel ? academiaById.get(resolveAcademiaIdByNome(academiaLabel) ?? '') : undefined
    let matchedBy: 'nome' | 'telefone' | null = academia ? 'nome' : null

    if (!academia && telefoneNumero) {
      academia = academiaByPhone.get(telefoneNumero)
      matchedBy = academia ? 'telefone' : null
    }

    if (!academia) {
      academiasNaoEncontradas.push(academiaLabel ?? telefoneNumero ?? '(sem academia nem telefone_numero)')
      distribuicao.push({
        academia_label: academiaLabel,
        telefone_numero: telefoneNumero,
        academia_id: null,
        academia_nome: null,
        matched_by: null,
        contatos_recebidos: contatos.length,
        contatos_inseridos: 0,
        contatos_ignorados: contatos.length,
      })
      contatosIgnorados += contatos.length
      continue
    }

    let inseridosNesteBloco = 0
    let ignoradosNesteBloco = 0

    for (const contato of contatos) {
      const nome = typeof contato.nome === 'string' ? contato.nome.trim() : ''
      const recebidoEm = typeof contato.recebido_em === 'string' ? parseDateTimeBR(contato.recebido_em) : null

      if (!nome || !recebidoEm) {
        ignoradosNesteBloco++
        continue
      }

      rows.push({
        nome,
        telefone: typeof contato.telefone === 'string' ? contato.telefone : null,
        academia_id: academia.id,
        created_at: recebidoEm.toISOString(),
      })
      inseridosNesteBloco++
    }

    contatosIgnorados += ignoradosNesteBloco
    distribuicao.push({
      academia_label: academiaLabel,
      telefone_numero: telefoneNumero,
      academia_id: academia.id,
      academia_nome: academia.nome,
      matched_by: matchedBy,
      contatos_recebidos: contatos.length,
      contatos_inseridos: inseridosNesteBloco,
      contatos_ignorados: ignoradosNesteBloco,
    })
  }

  if (rows.length > 0) {
    const values: unknown[] = []
    const placeholders = rows.map((row, i) => {
      const base = i * 4
      values.push(row.nome, row.telefone, row.academia_id, row.created_at)
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
    })

    try {
      await pool.query(
        `insert into contacts (nome, telefone, academia_id, created_at)
         values ${placeholders.join(', ')}
         on conflict (academia_id, telefone, created_at) do update set
           nome = excluded.nome`,
        values
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao gravar contatos.'
      await logWebhookCall({
        status: 'erro',
        payload: rawBody,
        distribuicao,
        totalRecebido: rows.length + contatosIgnorados,
        totalInserido: 0,
        totalIgnorado: rows.length + contatosIgnorados,
        academiasNaoEncontradas,
        errorMessage,
      })
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  }

  await logWebhookCall({
    status: 'sucesso',
    payload: rawBody,
    distribuicao,
    totalRecebido: rows.length + contatosIgnorados,
    totalInserido: rows.length,
    totalIgnorado: contatosIgnorados,
    academiasNaoEncontradas,
    errorMessage: null,
  })

  return NextResponse.json({
    recebido: true,
    contatos_processados: rows.length,
    contatos_ignorados: contatosIgnorados,
    academias_nao_encontradas: academiasNaoEncontradas,
  })
}
