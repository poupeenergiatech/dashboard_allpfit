import { NextResponse, type NextRequest } from 'next/server'
import { parseDateTimeBR } from '@/lib/dashboard/date-br'
import { pool } from '@/lib/db/pool'

export const dynamic = 'force-dynamic'

// Endpoint de entrada configurado no sistema agregador — ele chama isso 1x por dia com o
// lote de contatos novos, no mesmo formato do relatório que /api/relatorio envia (o
// agregador reusa o contrato). Ver docs/SPRINT7_NOTES.md para o payload de exemplo.
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

  let payload: IncomingPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição não é um JSON válido.' }, { status: 400 })
  }

  if (!Array.isArray(payload.por_academia)) {
    return NextResponse.json({ error: '"por_academia" é obrigatório e deve ser uma lista.' }, { status: 400 })
  }

  const { rows: academias } = await pool.query<{ id: string; numero_telefone: string | null }>(
    'select id, numero_telefone from academias'
  )
  const academiaIdByPhone = new Map(academias.map((a) => [a.numero_telefone, a.id]))

  const rows: ContactRow[] = []
  const academiasNaoEncontradas: string[] = []
  let contatosIgnorados = 0

  for (const entry of payload.por_academia as IncomingAcademia[]) {
    const telefoneNumero = typeof entry.telefone_numero === 'string' ? entry.telefone_numero : null
    const academiaId = telefoneNumero ? academiaIdByPhone.get(telefoneNumero) : undefined

    if (!telefoneNumero || !academiaId) {
      academiasNaoEncontradas.push(
        typeof entry.academia === 'string' ? entry.academia : telefoneNumero ?? '(sem telefone_numero)'
      )
      continue
    }

    const contatos = Array.isArray(entry.contatos) ? (entry.contatos as IncomingContato[]) : []

    for (const contato of contatos) {
      const nome = typeof contato.nome === 'string' ? contato.nome.trim() : ''
      const recebidoEm = typeof contato.recebido_em === 'string' ? parseDateTimeBR(contato.recebido_em) : null

      if (!nome || !recebidoEm) {
        contatosIgnorados++
        continue
      }

      rows.push({
        nome,
        telefone: typeof contato.telefone === 'string' ? contato.telefone : null,
        academia_id: academiaId,
        created_at: recebidoEm.toISOString(),
      })
    }
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
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Falha ao gravar contatos.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    recebido: true,
    contatos_processados: rows.length,
    contatos_ignorados: contatosIgnorados,
    academias_nao_encontradas: academiasNaoEncontradas,
  })
}
