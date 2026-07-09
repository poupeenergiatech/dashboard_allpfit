import { createAdminClient } from '@/lib/supabase/admin'
import type { ReportPayload } from './build-report-payload'

export type SendReportResult = { sent: boolean; status?: number; error?: string }

// Lê a URL de destino configurada em /configuracoes (report_settings) e envia o payload por
// POST. Não derruba o chamador em caso de falha — sempre retorna um resultado descritivo,
// no mesmo espírito de /api/agregador (falha externa não deve quebrar o resto do sistema).
export async function sendReportWebhook(payload: ReportPayload): Promise<SendReportResult> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('report_settings').select('webhook_url').eq('id', 1).maybeSingle()

  if (error) throw error

  const webhookUrl = data?.webhook_url
  if (!webhookUrl) {
    return { sent: false, error: 'Nenhuma URL de webhook configurada em Configurações.' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    return { sent: response.ok, status: response.status }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Falha ao chamar o webhook.' }
  }
}
