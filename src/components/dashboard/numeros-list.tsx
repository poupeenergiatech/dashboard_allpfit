import type { NumeroStatus } from '@/lib/dashboard/fetch-numeros'

export function NumerosList({ rows }: { rows: NumeroStatus[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3">Número</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Mensagens hoje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.academiaId} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-900">{row.nome}</td>
              <td className="px-4 py-3 text-slate-600">{row.numeroTelefone ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${row.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {row.ativo ? 'Online' : 'Offline'}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-slate-600">{row.mensagensHoje}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
