import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'

function formatDate(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

export function ManualDataHistoryTable({
  entries,
  onEdit,
}: {
  entries: ManualDataEntry[]
  onEdit?: (entry: ManualDataEntry) => void
}) {
  if (entries.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum lançamento manual ainda.</div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[780px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Scans</th>
            <th className="px-4 py-3 text-right">Reprovados</th>
            <th className="px-4 py-3 text-right">Ajuste contatos</th>
            <th className="px-4 py-3 text-right">Ajuste conversões</th>
            {onEdit && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{entry.academiaNome}</td>
              <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{formatDate(entry.data)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{entry.totalScans}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {entry.reprovados > 0 ? (
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{entry.reprovados}</span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">0</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {entry.contatosAjuste != null ? (
                  <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">{entry.contatosAjuste}</span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {entry.conversoesAjuste != null ? (
                  <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">{entry.conversoesAjuste}</span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>
              {onEdit && (
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    Editar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
