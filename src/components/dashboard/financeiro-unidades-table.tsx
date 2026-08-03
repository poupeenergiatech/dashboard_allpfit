type UnidadeFinanceiro = {
  academia: string
  ticketMedio: number
  recorrenciaMensal: number
  aReceber: number
}

// Dados fixos só pra ilustrar o layout — sem fonte real ainda (ver
// canAccessFinanceiro em src/lib/auth/profile.ts pra quem acessa a página). "A
// receber" usa os mesmos valores de MOCK_INVOICES (financeiro-invoices-table.tsx)
// pra manter o mockup coerente entre as duas seções.
const MOCK_UNIDADES: UnidadeFinanceiro[] = [
  { academia: 'Allp Fit Moema', ticketMedio: 198.5, recorrenciaMensal: 14200, aReceber: 18420 },
  { academia: 'Allp Fit Tatuapé', ticketMedio: 182.9, recorrenciaMensal: 11600, aReceber: 14980 },
  { academia: 'Allp Fit Santo Amaro', ticketMedio: 175.4, recorrenciaMensal: 9800, aReceber: 12300 },
  { academia: 'Allp Fit Pinheiros', ticketMedio: 205.1, recorrenciaMensal: 13400, aReceber: 16750 },
  { academia: 'Allp Fit Vila Mariana', ticketMedio: 168.75, recorrenciaMensal: 7900, aReceber: 9870 },
]

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinanceiroUnidadesTable() {
  return (
    <div className="card p-5">
      <p className="panel-title mb-1">Financeiro por unidade (mock)</p>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Ticket médio, recorrência mensal contratada e o valor a receber no período, academia a academia.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th className="py-2 pr-4 font-medium">Academia</th>
              <th className="py-2 pr-4 font-medium">Ticket médio</th>
              <th className="py-2 pr-4 font-medium">Recorrência mensal</th>
              <th className="py-2 font-medium">A receber no período</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_UNIDADES.map((unidade) => (
              <tr key={unidade.academia}>
                <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{unidade.academia}</td>
                <td className="py-3 pr-4 tabular-nums text-slate-600 dark:text-slate-300">
                  {formatCurrency(unidade.ticketMedio)}
                </td>
                <td className="py-3 pr-4 tabular-nums text-slate-600 dark:text-slate-300">
                  {formatCurrency(unidade.recorrenciaMensal)}
                </td>
                <td className="py-3 tabular-nums font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(unidade.aReceber)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
