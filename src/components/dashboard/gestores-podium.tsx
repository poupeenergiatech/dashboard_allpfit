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
      <p className="panel-title mb-6">Pódio de conversões — top 3 academias no período</p>
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
