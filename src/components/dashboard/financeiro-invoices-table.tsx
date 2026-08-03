type InvoiceStatus = 'pago' | 'pendente' | 'atrasado'

type MockInvoice = {
  academia: string
  competencia: string
  valor: number
  vencimento: string
  status: InvoiceStatus
}

// Dados fixos só pra ilustrar o layout — sem fonte real ainda (ver
// canAccessFinanceiro em src/lib/auth/profile.ts pra quem acessa a página).
const MOCK_INVOICES: MockInvoice[] = [
  { academia: 'Allp Fit Moema', competencia: 'Ago/2026', valor: 18420, vencimento: '05/08/2026', status: 'pago' },
  { academia: 'Allp Fit Tatuapé', competencia: 'Ago/2026', valor: 14980, vencimento: '05/08/2026', status: 'pago' },
  { academia: 'Allp Fit Santo Amaro', competencia: 'Ago/2026', valor: 12300, vencimento: '05/08/2026', status: 'pendente' },
  { academia: 'Allp Fit Pinheiros', competencia: 'Jul/2026', valor: 16750, vencimento: '05/07/2026', status: 'atrasado' },
  { academia: 'Allp Fit Vila Mariana', competencia: 'Ago/2026', valor: 9870, vencimento: '05/08/2026', status: 'pendente' },
]

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
}

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  pago: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  pendente: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  atrasado: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinanceiroInvoicesTable() {
  return (
    <div className="card p-5">
      <p className="panel-title mb-3">Últimas faturas (mock)</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th className="py-2 pr-4 font-medium">Academia</th>
              <th className="py-2 pr-4 font-medium">Competência</th>
              <th className="py-2 pr-4 font-medium">Vencimento</th>
              <th className="py-2 pr-4 font-medium">Valor</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_INVOICES.map((invoice) => (
              <tr key={`${invoice.academia}-${invoice.competencia}`}>
                <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{invoice.academia}</td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{invoice.competencia}</td>
                <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{invoice.vencimento}</td>
                <td className="py-3 pr-4 tabular-nums text-slate-900 dark:text-white">
                  {formatCurrency(invoice.valor)}
                </td>
                <td className="py-3">
                  <span className={`badge ${STATUS_BADGE[invoice.status]}`}>
                    <span className="badge-dot bg-current" />
                    {STATUS_LABEL[invoice.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
