export type ScansBreakdownRow = {
  academiaId: string
  academiaNome: string
  totalScans: number
}

// Detalhe por academia reaproveitado em qualquer lugar que expande um total de scans
// (histórico diário do funil, histórico dedicado em /scans) — maior primeiro, 0 em
// cinza claro pra não competir visualmente com quem de fato reportou.
export function ScansBreakdownTable({ rows }: { rows: ScansBreakdownRow[] }) {
  const sorted = [...rows].sort((a, b) => b.totalScans - a.totalScans)

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <table className="w-full min-w-[320px] text-xs">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-3 py-2">Academia</th>
            <th className="px-3 py-2 text-right">Scans</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.academiaId} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{r.academiaNome}</td>
              <td
                className={`px-3 py-2 text-right tabular-nums ${r.totalScans > 0 ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}
              >
                {r.totalScans}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
