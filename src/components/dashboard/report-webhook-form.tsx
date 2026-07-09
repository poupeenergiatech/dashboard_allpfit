'use client'

import { useTransition } from 'react'
import { saveReportWebhookUrl, sendReportNow } from '@/app/(app)/configuracoes/actions'
import { useToast } from '@/components/ui/toast'

export function ReportWebhookForm({ initialUrl }: { initialUrl: string | null }) {
  const [savePending, startSave] = useTransition()
  const [testPending, startTest] = useTransition()
  const { showToast } = useToast()

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startSave(async () => {
      try {
        await saveReportWebhookUrl(formData)
        showToast('Destino do relatório salvo.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
      }
    })
  }

  function handleTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTest(async () => {
      try {
        const result = await sendReportNow(formData)
        showToast(`Relatório de ${result.data} enviado — ${result.total} novo(s) contato(s).`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao enviar relatório.', 'error')
      }
    })
  }

  return (
    <div className="max-w-xl space-y-4">
      <form onSubmit={handleSave} className="card space-y-4 p-5">
        <div>
          <label className="field-label" htmlFor="webhook_url">
            Destino do Relatório — URL do Webhook
          </label>
          <input
            id="webhook_url"
            name="webhook_url"
            type="url"
            defaultValue={initialUrl ?? ''}
            placeholder="https://exemplo.com/webhooks/relatorio-diario"
            className="input"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Todo dia à meia-noite, um POST com o relatório de novos contatos do dia anterior é
            enviado para essa URL. Deixe em branco para desativar o envio.
          </p>
        </div>
        <button type="submit" disabled={savePending} className="btn-primary">
          {savePending ? 'Salvando…' : 'Salvar'}
        </button>
      </form>

      <form onSubmit={handleTest} className="card space-y-4 p-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">Testar envio agora</p>
          <p className="mt-1 text-xs text-slate-500">
            Dispara o mesmo relatório que o cron diário enviaria, para a URL salva acima.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="field-label" htmlFor="data">
              Data do relatório
            </label>
            <input
              id="data"
              name="data"
              type="date"
              defaultValue={new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
              className="input"
            />
          </div>
          <button type="submit" disabled={testPending} className="btn-secondary">
            {testPending ? 'Enviando…' : 'Enviar agora'}
          </button>
        </div>
      </form>
    </div>
  )
}
