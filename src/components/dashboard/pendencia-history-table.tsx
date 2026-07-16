import type { PendenciaEntry } from '@/lib/dashboard/fetch-pendencias-assinatura'

function formatDate(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

export function PendenciaHistoryTable({
  entries,
  onEdit,
}: {
  entries: PendenciaEntry[]
  onEdit: (entry: PendenciaEntry) => void
}) {
  if (entries.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum lançamento ainda.</div>
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Alunos pendentes</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{entry.academiaNome}</td>
              <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{formatDate(entry.data)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{entry.quantidade}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
