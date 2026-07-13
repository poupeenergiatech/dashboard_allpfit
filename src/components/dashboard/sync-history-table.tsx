import type { SyncLogEntry } from '@/lib/dashboard/fetch-sync-history'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function SyncHistoryTable({ entries }: { entries: SyncLogEntry[] }) {
  if (entries.length === 0) {
    return <div className="card-dashed text-sm text-slate-500">Nenhuma sincronização registrada ainda.</div>
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Quando</th>
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Convertidos</th>
            <th className="px-4 py-3 text-right">Novas</th>
            <th className="px-4 py-3 text-right">Já existentes</th>
            <th className="px-4 py-3">Não encontradas</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-50 align-top transition last:border-0 hover:bg-slate-50/70">
              <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-600">{formatDateTime(entry.createdAt)}</td>
              <td className="px-4 py-3">
                <span
                  className={`badge ${
                    entry.triggeredBy === 'manual' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {entry.triggeredBy === 'manual' ? 'Manual' : 'Automático'}
                </span>
              </td>
              <td className="px-4 py-3">
                {entry.status === 'sucesso' ? (
                  <span className="badge bg-emerald-50 text-emerald-700">Sucesso</span>
                ) : (
                  <span className="badge bg-rose-50 text-rose-700">Erro</span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.totalConvertidos ?? '—'}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.inseridas ?? '—'}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.jaExistentes ?? '—'}</td>
              <td className="px-4 py-3 max-w-[280px] text-xs text-slate-500">
                {entry.status === 'erro' ? (
                  <span className="text-rose-600">{entry.errorMessage}</span>
                ) : entry.naoEncontradas.length > 0 ? (
                  <span className="text-amber-700">
                    {entry.naoEncontradas.length}: {entry.naoEncontradas.join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
