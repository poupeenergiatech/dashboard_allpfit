import { FunnelCard } from './funnel-card'
import { Icon } from '@/components/ui/icons'
import type { FunnelCounts } from '@/lib/dashboard/types'

function rate(value: number, base: number): number | null {
  if (!base) return null
  return (value / base) * 100
}

// Ordem do funil (do documento de sprints): alunos totais -> scans QR ->
// contatos via WhatsApp -> total de clientes convertidos. Cada taxa é relativa à
// etapa anterior — essa é a 1ª linha, sempre visível. A 2ª linha ("Detalhamento")
// detalha a origem das conversões (Ane automática vs. manual/Bitrix) e adiciona
// reprovados/clientes Alle, que não são etapas sequenciais do funil — por isso não
// recebem conversionRate. Convertidos Ane/Manual só aparecem pro Super Admin: é
// detalhe operacional de canal de entrada, não algo que um gestor/coordenador
// precise pra ler o funil — o total já soma os dois em "Total de clientes
// convertidos" acima.
export function FunnelGrid({ counts, isSuperAdmin }: { counts: FunnelCounts; isSuperAdmin: boolean }) {
  const {
    totalAlunos,
    totalScans,
    totalContatos,
    totalConversoesAne,
    totalConversoesManual,
    totalConversoes,
    totalReprovados,
    totalClientesAlle,
  } = counts

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FunnelCard label="Alunos totais" value={totalAlunos} icon={<Icon name="users" className="h-[18px] w-[18px]" />} accent="blue" />
        <FunnelCard
          label="Scans QR"
          value={totalScans}
          conversionRate={rate(totalScans, totalAlunos)}
          icon={<Icon name="qr" className="h-[18px] w-[18px]" />}
          accent="violet"
        />
        <FunnelCard
          label="Contatos (WhatsApp)"
          value={totalContatos}
          conversionRate={rate(totalContatos, totalScans)}
          icon={<Icon name="chat" className="h-[18px] w-[18px]" />}
          accent="emerald"
        />
        <FunnelCard
          label="Total de clientes convertidos"
          value={totalConversoes}
          conversionRate={rate(totalConversoes, totalContatos)}
          icon={<Icon name="trophy" className="h-[18px] w-[18px]" />}
          accent="accent"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Detalhamento
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
            accent="emerald"
          />
        </div>
      </div>
    </div>
  )
}
