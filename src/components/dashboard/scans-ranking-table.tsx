import { Avatar } from '@/components/ui/avatar'
import type { ScansPorAcademia } from '@/lib/dashboard/fetch-scans'

export function ScansRankingTable({ rows }: { rows: ScansPorAcademia[] }) {
  if (rows.length === 0) {
    return <div className="card-dashed text-sm text-slate-500">Nenhuma academia encontrada.</div>
  }

  const max = Math.max(...rows.map((r) => r.totalScans), 1)

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3 text-right">Scans</th>
            <th className="px-4 py-3">Participação</th>
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
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.totalScans}</td>
              <td className="px-4 py-3">
                <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${(row.totalScans / max) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
