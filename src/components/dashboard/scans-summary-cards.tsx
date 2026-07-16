import { FunnelCard } from './funnel-card'
import type { ScansSummary } from '@/lib/dashboard/fetch-scans'

const ICON_PROPS = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } as const

const ICONS = {
  qr: (
    <svg {...ICON_PROPS} className="h-[18px] w-[18px]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6v-6h-3"
      />
    </svg>
  ),
  trend: (
    <svg {...ICON_PROPS} className="h-[18px] w-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 002 2h16M7 15l3.5-4.5 3 3L19 8" />
    </svg>
  ),
  trophy: (
    <svg {...ICON_PROPS} className="h-[18px] w-[18px]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8m-4-4v4M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 3M17 6h3a3 3 0 01-3 3"
      />
    </svg>
  ),
}

export function ScansSummaryCards({ summary }: { summary: ScansSummary }) {
  const { totalScans, porAcademia, days } = summary
  const mediaDiaria = days ? Math.round(totalScans / days) : null
  const lider = porAcademia.length > 0 && porAcademia[0].totalScans > 0 ? porAcademia[0] : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FunnelCard label="Total de scans no período" value={totalScans} icon={ICONS.qr} accent="violet" />
      <FunnelCard
        label={days ? `Média diária (${days} dia${days > 1 ? 's' : ''})` : 'Média diária'}
        value={mediaDiaria ?? 0}
        icon={ICONS.trend}
        accent="blue"
      />
      <FunnelCard
        label={lider ? `Academia líder: ${lider.nome}` : 'Academia líder'}
        value={lider?.totalScans ?? 0}
        icon={ICONS.trophy}
        accent="amber"
      />
    </div>
  )
}
