import { FunnelCard } from './funnel-card'
import type { FunnelCounts } from '@/lib/dashboard/types'

function rate(value: number, base: number): number | null {
  if (!base) return null
  return (value / base) * 100
}

// Ordem do funil (do documento de sprints): alunos totais -> scans QR ->
// contatos via WhatsApp -> conversões. Cada taxa é relativa à etapa anterior.
export function FunnelGrid({ counts }: { counts: FunnelCounts }) {
  const { totalAlunos, totalScans, totalContatos, totalConversoes } = counts

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FunnelCard label="Alunos totais" value={totalAlunos} />
      <FunnelCard label="Scans QR" value={totalScans} conversionRate={rate(totalScans, totalAlunos)} />
      <FunnelCard
        label="Contatos (WhatsApp)"
        value={totalContatos}
        conversionRate={rate(totalContatos, totalScans)}
      />
      <FunnelCard
        label="Conversões"
        value={totalConversoes}
        conversionRate={rate(totalConversoes, totalContatos)}
      />
    </div>
  )
}
