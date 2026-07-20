import { Avatar } from '@/components/ui/avatar'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'

function conversionRate(totalConversoes: number, totalContatos: number): number {
  if (!totalContatos) return 0
  return (totalConversoes / totalContatos) * 100
}

export function AcademiaTable({ rows }: { rows: AcademiaPerformance[] }) {
  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
        Nenhuma academia encontrada.
      </div>
    )
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3 text-right">Contatos</th>
            <th className="px-4 py-3 text-right">Convertidos Ane</th>
            <th className="px-4 py-3 text-right">Convertidos Manual</th>
            <th className="px-4 py-3 text-right">Total convertidos</th>
            <th className="px-4 py-3">Taxa de conversão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rate = conversionRate(row.totalConversoes, row.totalContatos)
            return (
              <tr key={row.academiaId} className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.nome} />
                    <span className="font-medium text-slate-900 dark:text-white">{row.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{row.totalContatos}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{row.totalConversoesAne}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{row.totalConversoesManual}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                  {row.totalConversoes}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400">
                      {rate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
