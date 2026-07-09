'use server'

import { revalidatePath } from 'next/cache'
import { buildReportPayload } from '@/lib/dashboard/build-report-payload'
import { sendReportWebhook } from '@/lib/dashboard/send-report-webhook'
import { createClient } from '@/lib/supabase/server'
import { canManageUsers, getCurrentUserProfile } from '@/lib/supabase/profile'

function assertSuperAdmin(role: string | undefined) {
  if (role !== 'super_admin') {
    throw new Error('Apenas Super Admin pode gerenciar o destino do relatório.')
  }
}

export async function saveReportWebhookUrl(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode alterar o destino do relatório.')
  }

  const url = String(formData.get('webhook_url') ?? '').trim()

  if (url) {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error('URL inválida — use um endereço http(s) completo.')
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL inválida — use um endereço http(s) completo.')
    }
  }

  const supabase = createClient()
  // RLS (report_settings_write, migration 0012) é a barreira de verdade: só super_admin
  // consegue escrever aqui mesmo que o check acima seja contornado.
  const { error } = await supabase
    .from('report_settings')
    .upsert({ id: 1, webhook_url: url || null, updated_at: new Date().toISOString() })

  if (error) throw error

  revalidatePath('/configuracoes')
}

// Dispara manualmente o mesmo fluxo do cron (/api/relatorio) pra validar a URL configurada
// sem esperar a meia-noite. Retorna o total de contatos enviados pra feedback na UI.
export async function sendReportNow(formData: FormData) {
  const profile = await getCurrentUserProfile()
  assertSuperAdmin(profile?.role)

  const dataStr = String(formData.get('data') ?? '').trim()
  let reportDate: Date
  if (dataStr) {
    reportDate = new Date(`${dataStr}T00:00:00`)
    if (Number.isNaN(reportDate.getTime())) throw new Error('Data inválida.')
  } else {
    reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - 1)
  }

  const payload = await buildReportPayload(reportDate)
  const result = await sendReportWebhook(payload)

  if (!result.sent) {
    throw new Error(result.error ?? `O webhook respondeu com status ${result.status}.`)
  }

  return { total: payload.total_novos_contatos, data: payload.data_relatorio }
}
