'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { NAV_ITEMS } from '@/lib/dashboard/nav-items'
import { useMobileNav } from './nav-context'
import type { UserRole } from '@/lib/auth/profile'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- asset local pequeno e fixo, sem next/image em nenhum outro lugar do app */}
      <img src="/logo.png" alt="" className="h-9 w-9 shrink-0" />
      <span className="leading-tight">
        <span className="block text-[15px] font-bold text-slate-900 dark:text-white">Allp Fit</span>
        <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500">Performance</span>
      </span>
    </Link>
  )
}

// basePath permite reusar o mesmo Sidebar/navegação na área autenticada real
// ("") e na rota de prévia com dados fictícios ("/preview").
export function Sidebar({ role, basePath = '' }: { role: UserRole | null; basePath?: string }) {
  const pathname = usePathname()
  const { open, setOpen } = useMobileNav()
  const items = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)))

  function nav(onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => {
          const href = `${basePath}${item.href}` || '/'
          const active = pathname === href
          return (
            <Link
              key={item.href}
              href={href}
              onClick={onNavigate}
              title={item.hint}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon
                name={item.icon}
                className={`h-[18px] w-[18px] shrink-0 transition ${
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center border-b border-slate-100 px-5 dark:border-slate-800">
          <Logo />
        </div>
        {nav()}
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Allp Fit × Alle Energia</p>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
          />
          <aside className="relative flex h-full w-72 flex-col bg-white shadow-2xl animate-fade-up dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <Icon name="close" className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {nav(() => setOpen(false))}
          </aside>
        </div>
      )}
    </>
  )
}
