'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { buildReportPayload } from '@/lib/dashboard/build-report-payload'
import { sendReportWebhook } from '@/lib/dashboard/send-report-webhook'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'
import { runAlleDocumentosSync, type SyncAlleDocumentosResult } from '@/lib/dashboard/sync-alle-documentos'

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

  // Sem RLS, o check de canManageUsers acima é a barreira de verdade pra essa tabela.
  await pool.query('update report_settings set webhook_url = $1, updated_at = now() where id = 1', [
    url || null,
  ])

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

export type { SyncAlleDocumentosResult }

// Disparo manual (botão em /configuracoes) do sync — ver runAlleDocumentosSync pra
// lógica de matching. O disparo automático roda sozinho, uma vez por dia, pelo
// scheduler embutido no processo do servidor (src/lib/dashboard/sync-scheduler.ts,
// ligado/desligado por setAutoSyncEnabled abaixo); o endpoint /api/sync-alle-documentos
// continua existindo como alternativa via cron externo. Os três gravam em
// alle_documentos_sync_log (fetchSyncHistory), então o histórico da tela cobre todas
// as origens.
export async function syncAlleDocumentosConvertidos(): Promise<SyncAlleDocumentosResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode sincronizar conversões.')
  }

  const result = await runAlleDocumentosSync('manual')

  revalidatePath('/configuracoes')
  revalidatePath('/performance')
  revalidatePath('/')

  return result
}

export async function setAutoSyncEnabled(enabled: boolean) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode ativar/desativar a sincronização automática.')
  }

  await pool.query('update alle_documentos_sync_settings set enabled = $1, updated_at = now() where id = 1', [
    enabled,
  ])

  revalidatePath('/configuracoes')
}
