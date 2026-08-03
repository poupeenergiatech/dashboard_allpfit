import { Icon, type IconName } from '@/components/ui/icons'

type Accent = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber'

const ACCENT_STYLES: Record<Accent, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  blue: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
}

type Tile = { label: string; value: string; sub?: string; icon: IconName; accent: Accent }

// Dados fixos só pra ilustrar o layout — sem fonte real ainda (ver
// canAccessFinanceiro em src/lib/auth/profile.ts pra quem acessa a página).
const TILES: Tile[] = [
  { label: 'Receita no período', value: 'R$ 128.450', icon: 'money', accent: 'emerald' },
  { label: 'Receita recorrente (MRR)', value: 'R$ 42.900', icon: 'trend', accent: 'blue' },
  { label: 'Ticket médio geral', value: 'R$ 189,90', icon: 'trophy', accent: 'violet' },
  {
    label: 'Retenção de clientes',
    value: '94,2%',
    sub: '312 de 331 ativos há 90+ dias',
    icon: 'shield',
    accent: 'amber',
  },
  { label: 'Inadimplência', value: '4,8%', icon: 'warning', accent: 'rose' },
]

export function FinanceiroSummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {TILES.map((tile) => (
        <div key={tile.label} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{tile.label}</p>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ACCENT_STYLES[tile.accent]}`}>
              <Icon name={tile.icon} className="h-[18px] w-[18px]" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {tile.value}
          </p>
          {tile.sub && <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">{tile.sub}</p>}
        </div>
      ))}
    </div>
  )
}
