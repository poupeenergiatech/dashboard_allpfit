import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'

function conversionRate(totalConversoes: number, totalContatos: number): number {
  if (!totalContatos) return 0
  return (totalConversoes / totalContatos) * 100
}

export function AcademiaTable({ rows }: { rows: AcademiaPerformance[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhuma academia encontrada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Academia</th>
            <th className="px-4 py-3 text-right">Contatos</th>
            <th className="px-4 py-3 text-right">Conversões</th>
            <th className="px-4 py-3">Taxa de conversão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rate = conversionRate(row.totalConversoes, row.totalContatos)
            return (
              <tr key={row.academiaId} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{row.nome}</td>
                <td className="px-4 py-3 text-right text-slate-600">{row.totalContatos}</td>
                <td className="px-4 py-3 text-right text-slate-600">{row.totalConversoes}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-700"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs text-slate-500">
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
