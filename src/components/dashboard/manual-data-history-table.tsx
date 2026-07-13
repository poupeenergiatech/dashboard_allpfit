import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'

function formatDate(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

export function ManualDataHistoryTable({
  entries,
  onEdit,
}: {
  entries: ManualDataEntry[]
  onEdit: (entry: ManualDataEntry) => void
}) {
  if (entries.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500">Nenhum lançamento manual ainda.</div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Alunos</th>
            <th className="px-4 py-3 text-right">Scans</th>
            <th className="px-4 py-3 text-right">Ajuste contatos</th>
            <th className="px-4 py-3 text-right">Ajuste conversões</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
              <td className="px-4 py-3 font-medium text-slate-900">{entry.academiaNome}</td>
              <td className="px-4 py-3 tabular-nums text-slate-600">{formatDate(entry.data)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.totalAlunos}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.totalScans}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {entry.contatosAjuste != null ? (
                  <span className="badge bg-amber-50 text-amber-700">{entry.contatosAjuste}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {entry.conversoesAjuste != null ? (
                  <span className="badge bg-amber-50 text-amber-700">{entry.conversoesAjuste}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
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
