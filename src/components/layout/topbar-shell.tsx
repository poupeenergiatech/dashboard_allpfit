'use client'

import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { NAV_ITEMS } from '@/lib/dashboard/nav-items'
import { useMobileNav } from './nav-context'

// Casca do cabeçalho compartilhada entre a área autenticada (Topbar) e a rota de
// prévia (/preview) — cuida do botão de menu mobile e do título dinâmico da
// seção atual; cada chamador só entra com o conteúdo do lado direito (avatar,
// badge de role etc.), que difere entre dados reais e fictícios.
export function TopbarShell({
  basePath = '',
  subtitle = 'Allp Fit × Alle Energia',
  children,
}: {
  basePath?: string
  subtitle?: string
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const { setOpen, desktopCollapsed, setDesktopCollapsed } = useMobileNav()

  const current = NAV_ITEMS.find((item) => pathname === (`${basePath}${item.href}` || '/'))
  const title = current?.label ?? 'Dashboard de Performance'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu de navegação"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:hidden"
        >
          <Icon name="menu" className="h-5 w-5" strokeWidth={2} />
        </button>
        {/* Recolher a sidebar fixa (>= md) — útil em telas de notebook, onde 256px de
            sidebar + o conteúdo centralizado ficam apertados; o drawer mobile acima
            é outro botão/estado (setOpen), esse aqui só existe em telas maiores. */}
        <button
          type="button"
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          aria-label={desktopCollapsed ? 'Mostrar menu de navegação' : 'Esconder menu de navegação'}
          title={desktopCollapsed ? 'Mostrar menu de navegação' : 'Esconder menu de navegação'}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 md:flex"
        >
          <Icon name="menu" className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">{children}</div>
    </header>
  )
}
