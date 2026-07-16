import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { ScansSummary } from '@/lib/dashboard/fetch-scans'

export function ScansSummaryCards({ summary }: { summary: ScansSummary }) {
  const { totalScans, porAcademia, days } = summary
  const mediaDiaria = days ? Math.round(totalScans / days) : null
  const lider = porAcademia.length > 0 && porAcademia[0].totalScans > 0 ? porAcademia[0] : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FunnelCard
        label="Total de scans no período"
        value={totalScans}
        icon={<Icon name="qr" className="h-[18px] w-[18px]" />}
        accent="violet"
      />
      <FunnelCard
        label={days ? `Média diária (${days} dia${days > 1 ? 's' : ''})` : 'Média diária'}
        value={mediaDiaria ?? 0}
        icon={<Icon name="trend" className="h-[18px] w-[18px]" />}
        accent="blue"
      />
      <FunnelCard
        label={lider ? `Academia líder: ${lider.nome}` : 'Academia líder'}
        value={lider?.totalScans ?? 0}
        icon={<Icon name="trophy" className="h-[18px] w-[18px]" />}
        accent="accent"
      />
    </div>
  )
}
