import { FunnelCard } from './funnel-card'
import type { FunnelCounts } from '@/lib/dashboard/types'

function rate(value: number, base: number): number | null {
  if (!base) return null
  return (value / base) * 100
}

const ICON_PROPS = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } as const

const ICONS = {
  users: (
    <svg {...ICON_PROPS} className="h-[18px] w-[18px]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm7 3a4 4 0 00-3-3.87"
      />
    </svg>
  ),
  qr: (
    <svg {...ICON_PROPS} className="h-[18px] w-[18px]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6v-6h-3"
      />
    </svg>
  ),
  chat: (
    <svg {...ICON_PROPS} className="h-[18px] w-[18px]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
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

// Ordem do funil (do documento de sprints): alunos totais -> scans QR ->
// contatos via WhatsApp -> conversões. Cada taxa é relativa à etapa anterior.
export function FunnelGrid({ counts }: { counts: FunnelCounts }) {
  const { totalAlunos, totalScans, totalContatos, totalConversoes } = counts

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FunnelCard label="Alunos totais" value={totalAlunos} icon={ICONS.users} accent="blue" />
      <FunnelCard
        label="Scans QR"
        value={totalScans}
        conversionRate={rate(totalScans, totalAlunos)}
        icon={ICONS.qr}
        accent="violet"
      />
      <FunnelCard
        label="Contatos (WhatsApp)"
        value={totalContatos}
        conversionRate={rate(totalContatos, totalScans)}
        icon={ICONS.chat}
        accent="emerald"
      />
      <FunnelCard
        label="Conversões"
        value={totalConversoes}
        conversionRate={rate(totalConversoes, totalContatos)}
        icon={ICONS.trophy}
        accent="amber"
      />
    </div>
  )
}
