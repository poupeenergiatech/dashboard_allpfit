import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icons'
import type { GestoresPanelRow } from '@/lib/dashboard/fetch-gestores-panel'

const PLACE = [
  {
    order: 'sm:order-2',
    riser: 'h-24 sm:h-28 bg-gradient-to-b from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600',
    ring: 'ring-amber-300 dark:ring-amber-500/50',
    badge: 'bg-amber-400 text-amber-950',
    nameSize: 'text-base',
    valueSize: 'text-3xl',
  },
  {
    order: 'sm:order-1',
    riser: 'h-16 sm:h-20 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-600',
    ring: 'ring-slate-300 dark:ring-slate-600',
    badge: 'bg-slate-300 text-slate-800 dark:bg-slate-500 dark:text-slate-950',
    nameSize: 'text-sm',
    valueSize: 'text-2xl',
  },
  {
    order: 'sm:order-3',
    riser: 'h-10 sm:h-12 bg-gradient-to-b from-orange-300 to-orange-400 dark:from-orange-500 dark:to-orange-600',
    ring: 'ring-orange-300 dark:ring-orange-500/50',
    badge: 'bg-orange-300 text-orange-950 dark:bg-orange-400',
    nameSize: 'text-sm',
    valueSize: 'text-2xl',
  },
]

// Pódio das 3 academias com mais conversões no período — o placar principal da
// "competição entre unidades" pedida: destaque visual rápido de quem está na
// frente, sem precisar ler a tabela completa abaixo. `rows` já vem ordenado por
// totalConversoes desc (ver fetchGestoresPanel). Degraus com altura real (não só
// padding) formam o efeito de pódio físico — 1º mais alto e ao centro, 2º/3º mais
// baixos nas laterais — com o avatar "em pé" sobre o degrau.
export function GestoresPodium({ rows }: { rows: GestoresPanelRow[] }) {
  const top3 = rows.slice(0, 3)

  if (top3.length === 0) {
    return null
  }

  return (
    <div className="card p-5 sm:p-6">
      <p className="mb-6 text-sm font-medium text-slate-500 dark:text-slate-400">
        Pódio de conversões — top 3 academias no período
      </p>
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
                    {row.totalConversoes.toLocaleString('pt-BR')}
                    <span className="ml-1 text-xs font-medium text-slate-400 dark:text-slate-500">conversões</span>
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
    </div>
  )
}
