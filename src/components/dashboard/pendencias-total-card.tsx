import { FunnelCard } from './funnel-card'
import type { PendenciaPorAcademia } from '@/lib/dashboard/fetch-pendencias-assinatura'

// Mesmo ícone de "Pendentes de Assinatura" no menu lateral (sidebar.tsx), pra
// manter a mesma identidade visual da página.
const PEN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.5-9.5a2.121 2.121 0 013 3L12 16l-4 1 1-4 9.5-9.5z"
    />
  </svg>
)

// Soma do backlog atual (última quantidade lançada por academia, ver
// fetchPendenciasPorAcademia) — é o mesmo dado do gráfico de barras logo abaixo,
// só que como número único de "olhar rápido".
export function PendenciasTotalCard({ rows }: { rows: PendenciaPorAcademia[] }) {
  const total = rows.reduce((sum, row) => sum + row.quantidade, 0)

  return (
    <div className="max-w-xs">
      <FunnelCard label="Total de pendências" value={total} icon={PEN_ICON} accent="rose" />
    </div>
  )
}
