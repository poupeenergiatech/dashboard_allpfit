import { AgregadorWebhookLogTable } from '@/components/dashboard/agregador-webhook-log-table'
import { ReportWebhookForm } from '@/components/dashboard/report-webhook-form'
import { SyncAlleDocumentosButton } from '@/components/dashboard/sync-alle-documentos-button'
import { SyncHistoryTable } from '@/components/dashboard/sync-history-table'
import { fetchAgregadorWebhookLog } from '@/lib/dashboard/fetch-agregador-webhook-log'
import { fetchAllAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchReportWebhookUrl } from '@/lib/dashboard/fetch-report-config'
import { fetchAutoSyncEnabled } from '@/lib/dashboard/fetch-sync-settings'
import { fetchSyncHistory } from '@/lib/dashboard/fetch-sync-history'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'

export default async function ConfiguracoesPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-sm font-medium text-amber-800">
        Acesso restrito ao Super Admin.
      </div>
    )
  }

  const [webhookUrl, academias, syncHistory, autoSyncEnabled, agregadorWebhookLog] = await Promise.all([
    fetchReportWebhookUrl(),
    fetchAllAcademias(),
    fetchSyncHistory(),
    fetchAutoSyncEnabled(),
    fetchAgregadorWebhookLog(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Configurações</h2>
        <p className="page-subtitle">Destino do relatório diário de novos contatos.</p>
      </div>

      <ReportWebhookForm initialUrl={webhookUrl} />
      <SyncAlleDocumentosButton
        academias={academias.map((a) => ({ id: a.id, nome: a.nome }))}
        autoSyncEnabled={autoSyncEnabled}
      />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Histórico de sincronizações</h3>
        <SyncHistoryTable entries={syncHistory} />
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Histórico de payloads do agregador</h3>
        <p className="mb-3 text-xs text-slate-500">
          Chamadas recebidas em <code>/api/webhooks/agregador</code> — payload bruto e como cada bloco
          &quot;por_academia&quot; foi distribuído (casamento por nome da unidade, com telefone como
          desempate quando o nome não bate com nada).
        </p>
        <AgregadorWebhookLogTable entries={agregadorWebhookLog} />
      </div>
    </div>
  )
}
