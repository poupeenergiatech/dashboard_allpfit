import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelData } from '@/lib/dashboard/fetch-gestores-panel'

// Só as 2 métricas que de fato respondem ao filtro de período do painel
// (Scans/Conversões no período). "Clientes Alle ativos" e "Pendentes de
// assinatura" saíram daqui — são fotos do estado atual (sem filtro por
// created_at nas queries de fetch-gestores-panel.ts), então ficavam exibidos
// ao lado de cards que mudam com o filtro sem nunca mudar eles mesmos,
// dando a falsa impressão de que também respondiam ao período. Esses dois
// números continuam disponíveis por academia na tabela de ranking abaixo
// (GestoresRankingTable) e nas telas que já são a fonte deles
// (/clientes-alle, /pendentes).
export function GestoresPanelSummaryCards({ data }: { data: GestoresPanelData }) {
  const { totals } = data

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    </div>
  )
}
