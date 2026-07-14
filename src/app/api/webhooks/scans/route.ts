import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { parseDateBRToISODate } from '@/lib/dashboard/date-br'
import { pool } from '@/lib/db/pool'
import { buildAcademiaNomeResolver } from '@/lib/dashboard/resolve-academia-by-nome'

export const dynamic = 'force-dynamic'

// Endpoint de entrada pro RPA que lê os scans de QR code do dia numa plataforma externa e
// empurra o total por academia pra cá — mesmo desenho do webhook do agregador
// (POST /api/webhooks/agregador), mas payload próprio porque scan não tem contato
// individual pra listar, só um total por unidade/dia:
//
// { "data": "14/07/2026", "gerado_em": "15/07/2026 06:00",
//   "por_academia": [ { "academia": "Allp Fit - Natal", "total_scans": 42 }, ... ] }
//
// "academia" é texto livre (nome da unidade) — casado do mesmo jeito que o webhook de
// contatos (normalizeNome/normalizeNomeLoose/academia_aliases, ver
// resolve-academia-by-nome.ts), pra reusar os vínculos que o Super Admin já cadastrar lá.
//
// Cada total_scans é o valor do dia inteiro, não incremental — reenviar o mesmo dia
// (reprocessamento, retry do RPA) sobrescreve com o mesmo número em vez de somar. Só a
// coluna total_scans de manual_data é tocada; total_alunos e os ajustes manuais de
// contatos/conversões (lançados em /performance) ficam intactos.
type IncomingAcademiaScan = {
  academia?: unknown
  total_scans?: unknown
}

type IncomingPayload = {
  data?: unknown
  por_academia?: unknown
}

type DistribuicaoEntry = {
  academia_label: string | null
  academia_id: string | null
  academia_nome: string | null
  total_scans: number | null
}

async function logWebhookCall(entry: {
  status: 'sucesso' | 'erro'
  payload: unknown
  distribuicao: DistribuicaoEntry[]
  totalAcademias: number | null
  totalAcademiasOk: number | null
  academiasNaoEncontradas: string[]
  errorMessage: string | null
}) {
  await pool.query(
    `insert into scans_webhook_log
       (status, payload, distribuicao, total_academias, total_academias_ok, academias_nao_encontradas, error_message)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      entry.status,
      entry.payload === undefined ? null : JSON.stringify(entry.payload),
      JSON.stringify(entry.distribuicao),
      entry.totalAcademias,
      entry.totalAcademiasOk,
      JSON.stringify(entry.academiasNaoEncontradas),
      entry.errorMessage,
    ]
  )
}

export async function POST(request: NextRequest) {
  const secret = process.env.SCANS_WEBHOOK_SECRET
  if (!secret) {
    // Mesma postura do webhook de contatos: isso GRAVA dados vindos de fora, então recusa
    // por padrão sem segredo configurado em vez de aceitar sem checagem.
    return NextResponse.json({ error: 'SCANS_WEBHOOK_SECRET não configurado no servidor.' }, { status: 503 })
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
      totalAcademias: null,
      totalAcademiasOk: null,
      academiasNaoEncontradas: [],
      errorMessage: 'Corpo da requisição não é um JSON válido.',
    })
    return NextResponse.json({ error: 'Corpo da requisição não é um JSON válido.' }, { status: 400 })
  }

  const dataStr = typeof payload.data === 'string' ? payload.data : null
  const isoDate = dataStr ? parseDateBRToISODate(dataStr) : null

  if (!isoDate) {
    await logWebhookCall({
      status: 'erro',
      payload: rawBody,
      distribuicao: [],
      totalAcademias: null,
      totalAcademiasOk: null,
      academiasNaoEncontradas: [],
      errorMessage: '"data" é obrigatória, no formato DD/MM/YYYY.',
    })
    return NextResponse.json({ error: '"data" é obrigatória, no formato DD/MM/YYYY.' }, { status: 400 })
  }

  if (!Array.isArray(payload.por_academia)) {
    await logWebhookCall({
      status: 'erro',
      payload: rawBody,
      distribuicao: [],
      totalAcademias: null,
      totalAcademiasOk: null,
      academiasNaoEncontradas: [],
      errorMessage: '"por_academia" é obrigatório e deve ser uma lista.',
    })
    return NextResponse.json({ error: '"por_academia" é obrigatório e deve ser uma lista.' }, { status: 400 })
  }

  const [{ rows: academias }, { rows: aliases }] = await Promise.all([
    pool.query<{ id: string; nome: string }>('select id, nome from academias'),
    pool.query<{ alias_nome: string; academia_id: string }>('select alias_nome, academia_id from academia_aliases'),
  ])
  const academiaById = new Map(academias.map((a) => [a.id, a]))
  const resolveAcademiaIdByNome = buildAcademiaNomeResolver(academias, aliases)

  const distribuicao: DistribuicaoEntry[] = []
  const academiasNaoEncontradas: string[] = []
  let totalAcademiasOk = 0

  for (const entry of payload.por_academia as IncomingAcademiaScan[]) {
    const academiaLabel = typeof entry.academia === 'string' ? entry.academia : null
    const totalScans = typeof entry.total_scans === 'number' && Number.isFinite(entry.total_scans)
      ? Math.trunc(entry.total_scans)
      : null

    const academia = academiaLabel ? academiaById.get(resolveAcademiaIdByNome(academiaLabel) ?? '') : undefined

    if (!academia || totalScans === null) {
      academiasNaoEncontradas.push(academiaLabel ?? '(sem academia)')
      distribuicao.push({
        academia_label: academiaLabel,
        academia_id: null,
        academia_nome: null,
        total_scans: totalScans,
      })
      continue
    }

    await pool.query(
      `insert into manual_data (academia_id, data, total_scans, updated_at)
       values ($1, $2, $3, now())
       on conflict (academia_id, data) do update set
         total_scans = excluded.total_scans,
         updated_at = now()`,
      [academia.id, isoDate, totalScans]
    )

    totalAcademiasOk++
    distribuicao.push({
      academia_label: academiaLabel,
      academia_id: academia.id,
      academia_nome: academia.nome,
      total_scans: totalScans,
    })
  }

  await logWebhookCall({
    status: 'sucesso',
    payload: rawBody,
    distribuicao,
    totalAcademias: distribuicao.length,
    totalAcademiasOk,
    academiasNaoEncontradas,
    errorMessage: null,
  })

  if (totalAcademiasOk > 0) {
    revalidatePath('/')
    revalidatePath('/performance')
  }

  return NextResponse.json({
    recebido: true,
    academias_processadas: totalAcademiasOk,
    academias_nao_encontradas: academiasNaoEncontradas,
  })
}
