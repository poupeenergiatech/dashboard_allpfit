import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelData } from '@/lib/dashboard/fetch-gestores-panel'

// Resumo enxuto do topo: só Contatos e Conversões no período. "Scans no
// período" saiu daqui a pedido do usuário (ver pódio de scans substituído por
// "Clientes Alle ativos" em gestores-podium.tsx) e segue disponível por
// academia na tabela de ranking abaixo (GestoresRankingTable) e no gráfico
// GestoresScansChart. "Pendentes de assinatura" é foto do estado atual (sem
// filtro por período), então ficaria enganoso ao lado de cards que mudam com o
// filtro — segue disponível em /pendentes. "Clientes Alle ativos" hoje
// responde ao período (conta ativações na janela, ver fetch-gestores-panel.ts),
// mas o usuário só pediu esse número no pódio ③ / ranking, não como card aqui.
export function GestoresPanelSummaryCards({ data }: { data: GestoresPanelData }) {
  const { totals } = data

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FunnelCard
        label="Contatos no período"
        value={totals.totalContatos}
        icon={<Icon name="users" className="h-[18px] w-[18px]" />}
        accent="blue"
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
