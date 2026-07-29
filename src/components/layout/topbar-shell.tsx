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
  subtitle = 'Dashboard Alle Energia',
  children,
}: {
  basePath?: string
  subtitle?: string
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const { setOpen } = useMobileNav()

  const current = NAV_ITEMS.find((item) => pathname === (`${basePath}${item.href}` || '/'))
  const title = current?.label ?? 'Dashboard de Performance'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white px-[18px] py-[14px] dark:border-slate-800 dark:bg-slate-900 md:px-[26px]">
      <div className="flex min-w-0 items-center gap-3">
        {/* Só existe em telas pequenas (< md) — abre o drawer mobile. A partir de md
            a Sidebar já é sempre visível (rail colapsado ou expandido), com seu
            próprio botão de recolher/expandir no cabeçalho, ver sidebar.tsx. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu de navegação"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:hidden"
        >
          <Icon name="menu" className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">{children}</div>
    </header>
  )
}
