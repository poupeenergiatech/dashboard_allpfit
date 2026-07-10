import { ReportWebhookForm } from '@/components/dashboard/report-webhook-form'
import { SyncAlleDocumentosButton } from '@/components/dashboard/sync-alle-documentos-button'
import { fetchReportWebhookUrl } from '@/lib/dashboard/fetch-report-config'
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

  const webhookUrl = await fetchReportWebhookUrl()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Configurações</h2>
        <p className="page-subtitle">Destino do relatório diário de novos contatos.</p>
      </div>

      <ReportWebhookForm initialUrl={webhookUrl} />
      <SyncAlleDocumentosButton />
    </div>
  )
}
