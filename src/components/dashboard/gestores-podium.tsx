import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelRow } from '@/lib/dashboard/fetch-gestores-panel'

// Ouro/prata/bronze nos hex exatos do handoff de redesign (2026-07-29): gold
// #e8a721, silver #b9bfce, bronze #e08a44 — cada um com um degradê sutil (tom
// mais claro em cima) derivado desse hex, não os amber/slate/orange padrão do
// Tailwind (slate em particular foi remapeado pro sistema de tokens do handoff,
// então usar a paleta slate aqui pro "prata" ia herdar a cor errada).
const PLACE = [
  {
    order: 'sm:order-2',
    riser: 'h-[140px] sm:h-[190px] bg-gradient-to-b from-[#f0bb4d] to-[#e8a721] dark:from-[#e8a721] dark:to-[#c98f18]',
    ring: 'ring-[#f3d78f] dark:ring-[#e8a721]/50',
    badge: 'bg-[#e8a721] text-[#4a3405]',
    nameSize: 'text-base',
    valueSize: 'text-3xl',
  },
  {
    order: 'sm:order-1',
    riser: 'h-[100px] sm:h-[130px] bg-gradient-to-b from-[#cdd2dc] to-[#b9bfce] dark:from-[#b9bfce] dark:to-[#9aa0ac]',
    ring: 'ring-[#dde1e8] dark:ring-[#b9bfce]/50',
    badge: 'bg-[#b9bfce] text-[#2a2d38]',
    nameSize: 'text-sm',
    valueSize: 'text-2xl',
  },
  {
    order: 'sm:order-3',
    riser: 'h-[78px] sm:h-[100px] bg-gradient-to-b from-[#e79f66] to-[#e08a44] dark:from-[#e08a44] dark:to-[#c06f30]',
    ring: 'ring-[#f0c19f] dark:ring-[#e08a44]/50',
    badge: 'bg-[#e08a44] text-[#432405]',
    nameSize: 'text-sm',
    valueSize: 'text-2xl',
  },
]

export type PodiumMetricKey = 'totalContatos' | 'totalConversoes' | 'totalScansPeriodo'

// Cada métrica reaproveita uma cor já associada a ela em outro lugar do
// dashboard (violeta pro card "Scans no período", laranja de marca pra
// conversões — "resultado final" do funil, ver funnel-card.tsx) pra dar um
// diferencial rápido entre os 3 cards, que de resto têm o mesmo layout e eram
// fáceis de confundir à primeira vista.
const METRICS: Record<
  PodiumMetricKey,
  { title: string; unitLabel: string; icon: 'chat' | 'trophy' | 'qr'; badge: string; topBorder: string }
> = {
  totalContatos: {
    title: 'Pódio de contatos',
    unitLabel: 'contatos',
    icon: 'chat',
    badge: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    topBorder: 'border-t-brand-400 dark:border-t-brand-500/70',
  },
  totalConversoes: {
    title: 'Pódio de conversões',
    unitLabel: 'conversões',
    icon: 'trophy',
    badge: 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400',
    topBorder: 'border-t-accent-400 dark:border-t-accent-500/70',
  },
  totalScansPeriodo: {
    title: 'Pódio de scans de QR code',
    unitLabel: 'scans',
    icon: 'qr',
    badge: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    topBorder: 'border-t-violet-400 dark:border-t-violet-500/70',
  },
}

// Pódio das 3 academias líderes numa métrica, com o ranking das demais logo
// abaixo (rolável, pra não estourar a altura do card) — junta o que antes eram
// dois blocos separados (pódio + tabela de ranking) num único card por métrica,
// pra caber 3 lado a lado (contatos/conversões/scans) na mesma seção. Cada card
// ordena `rows` pela sua própria métrica — diferente do pódio de conversões
// original, não dá mais pra confiar na ordenação que já vem de fetchGestoresPanel,
// já que agora duas das três métricas (contatos, scans) não são o critério de
// ordenação padrão do servidor.
export function GestoresPodium({ rows, metricKey }: { rows: GestoresPanelRow[]; metricKey: PodiumMetricKey }) {
  const metric = METRICS[metricKey]
  const sorted = [...rows].sort((a, b) => b[metricKey] - a[metricKey])
  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)

  if (top3.length === 0) {
    return null
  }

  return (
    <div className={`card flex flex-col border-t-4 p-5 sm:p-6 ${metric.topBorder}`}>
      <div className="mb-6 flex items-center gap-2.5">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${metric.badge}`}>
          <Icon name={metric.icon} className="h-4 w-4" />
        </span>
        <p className="panel-title">{metric.title}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-center sm:gap-4">
        {top3.map((row, i) => {
          const style = PLACE[i]
          return (
            <div key={row.academiaId} className={`flex flex-1 flex-col items-center sm:max-w-[220px] ${style.order}`}>
              <div className="flex items-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center">
                <span className={`ring-2 rounded-full ${style.ring}`}>
                  <Avatar name={row.nome} />
                </span>
                <div className="sm:mt-1">
                  <p className={`font-semibold text-slate-900 dark:text-white ${style.nameSize}`}>{row.nome}</p>
                  <p className={`font-bold tabular-nums tracking-tight text-slate-900 dark:text-white ${style.valueSize}`}>
                    {row[metricKey].toLocaleString('pt-BR')}
                    <span className="ml-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                      {metric.unitLabel}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className={`mt-3 flex w-full items-start justify-center rounded-t-xl pt-2 shadow-inner sm:mt-4 ${style.riser}`}
              >
                {i === 0 ? (
                  <Icon name="trophy" className="h-6 w-6 text-amber-950/70" />
                ) : (
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${style.badge}`}>
                    {i + 1}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {rest.length > 0 && (
        <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-2">
          <div className="max-h-64 overflow-y-auto pr-1">
            <ul className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rest.map((row, i) => (
                <li key={row.academiaId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {i + 4}
                    </span>
                    <Avatar name={row.nome} className="h-6 w-6 text-[10px]" />
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{row.nome}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                    {row[metricKey].toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
