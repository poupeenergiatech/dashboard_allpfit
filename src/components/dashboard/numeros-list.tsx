import { Avatar } from '@/components/ui/avatar'
import type { NumeroStatus } from '@/lib/dashboard/fetch-numeros'

export function NumerosList({ rows }: { rows: NumeroStatus[] }) {
  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3">Número</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Mensagens hoje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.academiaId} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={row.nome} />
                  <span className="font-medium text-slate-900">{row.nome}</span>
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums text-slate-600">{row.numeroTelefone ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${row.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`badge-dot ${row.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {row.ativo ? 'Online' : 'Offline'}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.mensagensHoje}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
