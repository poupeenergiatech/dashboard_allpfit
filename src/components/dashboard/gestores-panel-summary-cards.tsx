import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelData } from '@/lib/dashboard/fetch-gestores-panel'

export function GestoresPanelSummaryCards({ data }: { data: GestoresPanelData }) {
  const { totals } = data

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FunnelCard
        label="Scans no período"
        value={totals.totalScansPeriodo}
        icon={<Icon name="qr" className="h-[18px] w-[18px]" />}
        accent="violet"
      />
      <FunnelCard
        label="Conversões no período"
        value={totals.totalConversoes}
        icon={<Icon name="trophy" className="h-[18px] w-[18px]" />}
        accent="accent"
      />
      <FunnelCard
        label="Clientes Alle ativos"
        value={totals.clientesAlleAtivos}
        icon={<Icon name="badge" className="h-[18px] w-[18px]" />}
        accent="emerald"
      />
      <FunnelCard
        label="Pendentes de assinatura"
        value={totals.pendentesAssinatura}
        icon={<Icon name="pen" className="h-[18px] w-[18px]" />}
        accent="rose"
      />
    </div>
  )
}
