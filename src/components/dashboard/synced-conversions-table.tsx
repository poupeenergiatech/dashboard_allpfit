import type { SyncedConversion } from '@/lib/dashboard/fetch-synced-conversions'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function SyncedConversionsTable({ entries }: { entries: SyncedConversion[] }) {
  if (entries.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
        Nenhuma conversão sincronizada ainda.
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3">Unidade</th>
            <th className="px-4 py-3">Sincronizado em</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
            >
              <td className="px-4 py-3 text-slate-900 dark:text-white">{entry.nome ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.telefone ?? '—'}</td>
              <td className="px-4 py-3">
                {entry.academiaNome ? (
                  <span className="text-slate-600 dark:text-slate-300">{entry.academiaNome}</span>
                ) : (
                  <span
                    className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    title="unidade_allpfit em branco ou não vinculada a nenhuma academia."
                  >
                    Sem unidade
                  </span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300">
                {formatDateTime(entry.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
