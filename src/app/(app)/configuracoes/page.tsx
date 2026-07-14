import { headers } from 'next/headers'
import { AgregadorWebhookLogTable } from '@/components/dashboard/agregador-webhook-log-table'
import { ScansWebhookLogTable } from '@/components/dashboard/scans-webhook-log-table'
import { SyncAlleDocumentosButton } from '@/components/dashboard/sync-alle-documentos-button'
import { SyncHistoryTable } from '@/components/dashboard/sync-history-table'
import { WebhookInfoCard } from '@/components/dashboard/webhook-info-card'
import { fetchAgregadorWebhookLog } from '@/lib/dashboard/fetch-agregador-webhook-log'
import { fetchAllAcademias } from '@/lib/dashboard/fetch-academias'
import { fetchAutoSyncEnabled } from '@/lib/dashboard/fetch-sync-settings'
import { fetchScansWebhookLog } from '@/lib/dashboard/fetch-scans-webhook-log'
import { fetchSyncHistory } from '@/lib/dashboard/fetch-sync-history'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'

function getWebhookUrl(path: string): string {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'SEU_DOMINIO'
  const proto = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}${path}`
}

export default async function ConfiguracoesPage() {
  const profile = await getCurrentUserProfile().catch(() => null)

  if (!profile || !canManageUsers(profile.role)) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-6 text-sm font-medium text-amber-800">
        Acesso restrito ao Super Admin.
      </div>
    )
  }

  const [academias, syncHistory, autoSyncEnabled, agregadorWebhookLog, scansWebhookLog] = await Promise.all([
    fetchAllAcademias(),
    fetchSyncHistory(),
    fetchAutoSyncEnabled(),
    fetchAgregadorWebhookLog(),
    fetchScansWebhookLog(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Configurações</h2>
        <p className="page-subtitle">
          Sincronização com o Alle Documentos e recebimento de contatos/scans de sistemas externos.
        </p>
      </div>

      <WebhookInfoCard
        title="Webhook de entrada — contatos do agregador"
        description="O dashboard não envia relatório pra fora — é o sistema agregador que chama essa URL uma vez por dia com o lote de contatos novos. Configure-a no painel dele."
        url={getWebhookUrl('/api/webhooks/agregador')}
        secretEnvVar="AGREGADOR_WEBHOOK_SECRET"
        secretConfigured={Boolean(process.env.AGREGADOR_WEBHOOK_SECRET)}
        footnote={
          'Formato do payload em docs/DEPLOY.md. Todo envio recebido — sucesso ou erro — aparece no ' +
          '"Histórico de payloads do agregador" abaixo.'
        }
      />

      <WebhookInfoCard
        title="Webhook de entrada — scans de QR code (RPA)"
        description='Anexe essa URL no RPA que lê os scans diários de QR code — ele chama uma vez por dia com o total de scans por academia. O valor sobrescreve o campo "Scans QR" do dia em /performance; alunos e ajustes manuais não são afetados.'
        url={getWebhookUrl('/api/webhooks/scans')}
        secretEnvVar="SCANS_WEBHOOK_SECRET"
        secretConfigured={Boolean(process.env.SCANS_WEBHOOK_SECRET)}
        footnote={
          'Formato do payload em docs/DEPLOY.md. Todo envio recebido — sucesso ou erro — aparece no ' +
          '"Histórico de payloads de scans" abaixo.'
        }
      />

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

      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Histórico de payloads de scans</h3>
        <p className="mb-3 text-xs text-slate-500">
          Chamadas recebidas em <code>/api/webhooks/scans</code> — payload bruto e como cada academia foi
          casada e gravada em manual_data.
        </p>
        <ScansWebhookLogTable entries={scansWebhookLog} />
      </div>
    </div>
  )
}
