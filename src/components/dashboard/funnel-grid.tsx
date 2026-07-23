import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { FunnelCounts } from '@/lib/dashboard/types'

// Alunos/scans/contatos/conversões já aparecem no FunnelStagesChart logo acima, com
// valor E taxa etapa a etapa — repetir os mesmos 4 números aqui como cards seria a
// mesma informação 2 vezes na tela. Esta grade cobre só o que o funil não mostra: de
// onde vieram as conversões (Ane automática vs. manual/Bitrix, só Super Admin — canal
// de entrada é detalhe operacional, não algo que um gestor precise pra ler o funil) e
// dois números que não são etapas sequenciais (reprovados, clientes Alle ativos).
// Clientes Alle ativos usa o accent laranja: é onde o funil de fato termina (assinou
// o termo de adesão), a mesma reserva de "resultado final" do card removido acima.
export function FunnelGrid({ counts, isSuperAdmin }: { counts: FunnelCounts; isSuperAdmin: boolean }) {
  const { totalConversoesAne, totalConversoesManual, totalReprovados, totalClientesAlle } = counts

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Detalhes da conversão
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperAdmin && (
          <FunnelCard
            label="Convertidos Ane"
            value={totalConversoesAne}
            icon={<Icon name="trend" className="h-[18px] w-[18px]" />}
            accent="blue"
          />
        )}
        {isSuperAdmin && (
          <FunnelCard
            label="Convertidos Manual"
            value={totalConversoesManual}
            icon={<Icon name="pen" className="h-[18px] w-[18px]" />}
            accent="amber"
          />
        )}
        <FunnelCard
          label="Reprovados / cancelados"
          value={totalReprovados}
          icon={<Icon name="x-circle" className="h-[18px] w-[18px]" />}
          accent="rose"
        />
        <FunnelCard
          label="Clientes Alle ativos"
          value={totalClientesAlle}
          icon={<Icon name="id-card" className="h-[18px] w-[18px]" />}
          accent="accent"
        />
      </div>
    </div>
  )
}
