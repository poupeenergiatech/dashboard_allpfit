import { NextResponse, type NextRequest } from 'next/server'
import { buildReportPayload } from '@/lib/dashboard/build-report-payload'
import { sendReportWebhook } from '@/lib/dashboard/send-report-webhook'

export const dynamic = 'force-dynamic'

// Disparada por um cron externo (ver docs/DEPLOY.md) uma vez por dia — monta o relatório de
// novos contatos do dia anterior e envia pro webhook configurado em /configuracoes.
// Aceita `?data=YYYY-MM-DD` para reprocessar/testar um dia específico.
//
// Protegida por CRON_SECRET (header `Authorization: Bearer <secret>`) pra ninguém de fora
// disparar o reenvio do relatório. Sem a variável configurada, roda sem checagem — aceitável
// só em dev; documentar isso claramente pra não virar um endpoint público em produção.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  const dataParam = request.nextUrl.searchParams.get('data')
  let reportDate: Date
  if (dataParam) {
    reportDate = new Date(`${dataParam}T00:00:00`)
    if (Number.isNaN(reportDate.getTime())) {
      return NextResponse.json({ error: 'Parâmetro "data" inválido — use YYYY-MM-DD.' }, { status: 400 })
    }
  } else {
    reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - 1)
  }

  try {
    const payload = await buildReportPayload(reportDate)
    const result = await sendReportWebhook(payload)
    return NextResponse.json({ ...result, payload })
  } catch (err) {
    return NextResponse.json(
      { sent: false, error: err instanceof Error ? err.message : 'Falha ao gerar/enviar o relatório.' },
      { status: 500 }
    )
  }
}
