import type { DailyFunnelPoint } from '@/lib/dashboard/types'

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

// Mais recente primeiro, igual às outras tabelas de histórico do app (manual_data,
// pendencias_assinatura) — só que aqui é sempre derivada (alunos/scans vêm de
// manual_data, contatos/conversões de contacts/conversions + ajuste), sem ação de
// editar: a edição continua em /performance e /pendentes.
export function FunnelDailyHistoryTable({ series }: { series: DailyFunnelPoint[] }) {
  if (series.length === 0) {
    return <div className="card-dashed text-sm text-slate-500">Nenhum dado no período selecionado.</div>
  }

  const rows = [...series].reverse()

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3 text-right">Alunos</th>
            <th className="px-4 py-3 text-right">Scans</th>
            <th className="px-4 py-3 text-right">Contatos</th>
            <th className="px-4 py-3 text-right">Conversões</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((point) => (
            <tr key={point.date} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70">
              <td className="px-4 py-3 font-medium text-slate-900">{formatDate(point.date)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.totalAlunos}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.totalScans}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.contatos}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{point.conversoes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
