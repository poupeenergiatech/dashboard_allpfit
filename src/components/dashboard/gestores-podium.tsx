import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelRow } from '@/lib/dashboard/fetch-gestores-panel'

// Geometria do pódio (ordem visual, altura do degrau, tamanho de texto) — igual
// pras 3 métricas, só a posição (1º/2º/3º) muda isso. Cor não mora mais aqui:
// ver PLACE_COLORS abaixo, que agora varia por métrica em vez do ouro/prata/
// bronze fixo que as 3 barras compartilhavam antes (elas ficavam idênticas de
// um card pro outro, só o texto do título diferenciava).
const PLACE_LAYOUT = [
  { order: 'sm:order-2', height: 'h-[140px] sm:h-[190px]', nameSize: 'text-base', valueSize: 'text-3xl' },
  { order: 'sm:order-1', height: 'h-[100px] sm:h-[130px]', nameSize: 'text-sm', valueSize: 'text-2xl' },
  { order: 'sm:order-3', height: 'h-[78px] sm:h-[100px]', nameSize: 'text-sm', valueSize: 'text-2xl' },
]

export type PodiumMetricKey = 'totalContatos' | 'totalConversoes' | 'totalScansPeriodo'

type PlaceColor = { riser: string; ring: string; badge: string }

// 3 tons de degrau por métrica (mais saturado no 1º lugar, mais claro no 3º) —
// mesma cor de marca do ícone/borda do card (ver METRICS), então a barra reforça
// a identidade da métrica em vez de repetir o ouro/prata/bronze genérico nos 3
// cards. Ícone de troféu no 1º lugar vira branco (ver `text-white/90` abaixo)
// porque o fundo aqui é bem mais saturado que o dourado original.
const PLACE_COLORS: Record<PodiumMetricKey, PlaceColor[]> = {
  totalContatos: [
    {
      riser: 'bg-gradient-to-b from-brand-400 to-brand-600 dark:from-brand-500 dark:to-brand-700',
      ring: 'ring-brand-200 dark:ring-brand-500/50',
      badge: '',
    },
    {
      riser: 'bg-gradient-to-b from-brand-300 to-brand-400 dark:from-brand-400 dark:to-brand-500',
      ring: 'ring-brand-100 dark:ring-brand-400/40',
      badge: 'bg-brand-400 text-white dark:bg-brand-400',
    },
    {
      riser: 'bg-gradient-to-b from-brand-200 to-brand-300 dark:from-brand-300 dark:to-brand-400',
      ring: 'ring-brand-100 dark:ring-brand-300/40',
      badge: 'bg-brand-200 text-brand-900 dark:bg-brand-300 dark:text-brand-950',
    },
  ],
  totalConversoes: [
    {
      riser: 'bg-gradient-to-b from-accent-400 to-accent-600 dark:from-accent-500 dark:to-accent-700',
      ring: 'ring-accent-200 dark:ring-accent-500/50',
      badge: '',
    },
    {
      riser: 'bg-gradient-to-b from-accent-300 to-accent-400 dark:from-accent-400 dark:to-accent-500',
      ring: 'ring-accent-100 dark:ring-accent-400/40',
      badge: 'bg-accent-400 text-white dark:bg-accent-400',
    },
    {
      riser: 'bg-gradient-to-b from-accent-200 to-accent-300 dark:from-accent-300 dark:to-accent-400',
      ring: 'ring-accent-100 dark:ring-accent-300/40',
      badge: 'bg-accent-200 text-accent-900 dark:bg-accent-300 dark:text-accent-950',
    },
  ],
  totalScansPeriodo: [
    {
      riser: 'bg-gradient-to-b from-violet-400 to-violet-600 dark:from-violet-500 dark:to-violet-700',
      ring: 'ring-violet-200 dark:ring-violet-500/50',
      badge: '',
    },
    {
      riser: 'bg-gradient-to-b from-violet-300 to-violet-400 dark:from-violet-400 dark:to-violet-500',
      ring: 'ring-violet-100 dark:ring-violet-400/40',
      badge: 'bg-violet-400 text-white dark:bg-violet-400',
    },
    {
      riser: 'bg-gradient-to-b from-violet-200 to-violet-300 dark:from-violet-300 dark:to-violet-400',
      ring: 'ring-violet-100 dark:ring-violet-300/40',
      badge: 'bg-violet-200 text-violet-900 dark:bg-violet-300 dark:text-violet-950',
    },
  ],
}

// Cada métrica reaproveita uma cor já associada a ela em outro lugar do
// dashboard (violeta pro card "Scans no período", laranja de marca pra
// conversões — "resultado final" do funil, ver funnel-card.tsx) pra dar um
// diferencial rápido entre os 3 cards, que de resto têm o mesmo layout e eram
// fáceis de confundir à primeira vista.
// Ordem de exibição dos 3 pódios na página — exportado pra quem precisa
// iterar as métricas na mesma ordem sem duplicar o array (ver export-podios.ts).
export const PODIUM_METRIC_KEYS: PodiumMetricKey[] = ['totalContatos', 'totalConversoes', 'totalScansPeriodo']

export const PODIUM_METRICS: Record<
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
// Mesmo critério de ordenação usado nos 3 cards do pódio (mais saturado no
// 1º lugar) — exportado pra export-podios.ts gerar CSV/PDF com a MESMA
// classificação que aparece na tela, em vez de reimplementar o sort lá.
export function rankRowsByMetric(rows: GestoresPanelRow[], metricKey: PodiumMetricKey): GestoresPanelRow[] {
  return [...rows].sort((a, b) => b[metricKey] - a[metricKey])
}

export function GestoresPodium({ rows, metricKey }: { rows: GestoresPanelRow[]; metricKey: PodiumMetricKey }) {
  const metric = PODIUM_METRICS[metricKey]
  const colors = PLACE_COLORS[metricKey]
  const sorted = rankRowsByMetric(rows, metricKey)
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
          const layout = PLACE_LAYOUT[i]
          const color = colors[i]
          return (
            <div key={row.academiaId} className={`flex flex-1 flex-col items-center sm:max-w-[220px] ${layout.order}`}>
              <div className="flex items-center gap-3 sm:flex-col sm:gap-1.5 sm:text-center">
                <span className={`ring-2 rounded-full ${color.ring}`}>
                  <Avatar name={row.nome} />
                </span>
                <div className="sm:mt-1">
                  <p className={`font-semibold text-slate-900 dark:text-white ${layout.nameSize}`}>{row.nome}</p>
                  <p className={`font-bold tabular-nums tracking-tight text-slate-900 dark:text-white ${layout.valueSize}`}>
                    {row[metricKey].toLocaleString('pt-BR')}
                    <span className="ml-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                      {metric.unitLabel}
                    </span>
                  </p>
                </div>
              </div>

              <div
                className={`mt-3 flex w-full items-start justify-center rounded-t-xl pt-2 shadow-inner sm:mt-4 ${layout.height} ${color.riser}`}
              >
                {i === 0 ? (
                  <Icon name="trophy" className="h-6 w-6 text-white/90" />
                ) : (
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${color.badge}`}>
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
