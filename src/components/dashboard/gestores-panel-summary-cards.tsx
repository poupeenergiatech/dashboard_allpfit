import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelData } from '@/lib/dashboard/fetch-gestores-panel'

// Resumo enxuto do topo: as 3 etapas do funil que respondem ao filtro de
// período — Contatos → Conversões → Clientes Alle ativados. "Scans no período"
// saiu daqui a pedido do usuário (ver pódio de scans substituído por "Clientes
// Alle ativos" em gestores-podium.tsx) e segue disponível por academia na
// tabela de ranking abaixo (GestoresRankingTable) e no gráfico
// GestoresScansChart. "Pendentes de assinatura" é foto do estado atual (sem
// filtro por período), então ficaria enganoso ao lado de cards que mudam com o
// filtro — segue disponível em /pendentes. O card "Clientes Alle" abaixo conta
// clientes cuja 1ª ativação (status→ativo) caiu na janela do filtro
// (totals.clientesAlleAtivos, ver fetch-gestores-panel.ts) — mesmo número do
// pódio ③ / coluna "Ativados período", e NÃO o headcount atual de ativos (esse
// segue no card "Clientes Alle ativos" da home / em /performance).
export function GestoresPanelSummaryCards({ data }: { data: GestoresPanelData }) {
  const { totals } = data

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <FunnelCard
        label="Clientes Alle ativados no período"
        value={totals.clientesAlleAtivos}
        icon={<Icon name="id-card" className="h-[18px] w-[18px]" />}
        accent="emerald"
      />
    </div>
  )
}
