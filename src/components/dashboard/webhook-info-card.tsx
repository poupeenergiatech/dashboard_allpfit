// Puramente informativo — sem formulário, porque não há nada pra salvar aqui: a URL é fixa
// (a própria rota) e o segredo vem de uma env var configurada no serviço. Existe só pra dar
// ao Super Admin o que ele precisa colar no painel/RPA externo sem abrir docs/DEPLOY.md.
// Compartilhado pelos dois webhooks de entrada (contatos do agregador, scans do RPA de QR).
export function WebhookInfoCard({
  title,
  description,
  url,
  secretEnvVar,
  secretConfigured,
  footnote,
}: {
  title: string
  description: string
  url: string
  secretEnvVar: string
  secretConfigured: boolean
  footnote: string
}) {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {secretConfigured ? (
          <span className="badge whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Segredo configurado</span>
        ) : (
          <span className="badge whitespace-nowrap bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">Segredo ausente</span>
        )}
      </div>

      <div>
        <label className="field-label">URL</label>
        <input readOnly value={url} className="input font-mono text-xs text-slate-600 dark:text-slate-300" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Método</label>
          <p className="text-sm text-slate-700 dark:text-slate-300">POST</p>
        </div>
        <div>
          <label className="field-label">Header</label>
          <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
            Authorization: Bearer &lt;{secretEnvVar}&gt;
          </p>
        </div>
      </div>

      {!secretConfigured && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          {secretEnvVar} não está configurada no servidor — o endpoint recusa toda chamada (503) até isso
          ser definido.
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">{footnote}</p>
    </div>
  )
}
