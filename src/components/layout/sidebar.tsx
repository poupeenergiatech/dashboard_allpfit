'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/icons'
import { NAV_ITEMS, type NavGroup, type NavItem } from '@/lib/dashboard/nav-items'
import { useMobileNav } from './nav-context'
import type { UserRole } from '@/lib/auth/profile'

const GROUP_ORDER: NavGroup[] = ['PRINCIPAL', 'MARKETING', 'OPERAÇÃO', 'GESTÃO', 'SISTEMA']

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- asset local pequeno e fixo, sem next/image em nenhum outro lugar do app */}
      <img src="/logo.png" alt="" className="h-[34px] w-[34px] shrink-0 rounded-[9px]" />
      {!collapsed && (
        <span className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-white">
          Dashboard
          <br />
          Alle Energia
        </span>
      )}
    </Link>
  )
}

function groupItems(items: NavItem[]): { group: NavGroup; items: NavItem[] }[] {
  return GROUP_ORDER.map((group) => ({ group, items: items.filter((item) => item.group === group) })).filter(
    (g) => g.items.length > 0
  )
}

// basePath permite reusar o mesmo Sidebar/navegação na área autenticada real
// ("") e na rota de prévia com dados fictícios ("/preview"). hiddenHrefs esconde
// itens além do filtro por role — hoje só /financeiro quando o Super Admin desliga
// o toggle "Mostrar Financeiro pra Direção e Gestor" em /configuracoes (ver
// AppLayout, que resolve isso a partir de fetchFinanceiroVisivelOutrosCargos).
export function Sidebar({
  role,
  basePath = '',
  hiddenHrefs = [],
}: {
  role: UserRole | null
  basePath?: string
  hiddenHrefs?: string[]
}) {
  const pathname = usePathname()
  const { open, setOpen, desktopCollapsed, setDesktopCollapsed } = useMobileNav()
  const items = NAV_ITEMS.filter(
    (item) => (!item.roles || (role && item.roles.includes(role))) && !hiddenHrefs.includes(item.href)
  )
  const groups = groupItems(items)

  function nav(collapsed: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-4 px-3 py-4">
        {groups.map(({ group, items: groupItems }) => (
          <div key={group}>
            {!collapsed && (
              <p className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {groupItems.map((item) => {
                const href = `${basePath}${item.href}` || '/'
                const active = pathname === href
                const title = collapsed ? (item.hint ? `${item.label} — ${item.hint}` : item.label) : item.hint
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={onNavigate}
                    title={title}
                    className={`group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 font-semibold'
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
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        <span
                          className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${
                            active ? 'bg-brand-600 dark:bg-brand-400' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col overflow-hidden border-r border-slate-200/70 bg-white transition-[width] duration-[180ms] ease-out md:flex dark:border-slate-800 dark:bg-[#12131a] ${
          desktopCollapsed ? 'md:w-[76px]' : 'md:w-[250px]'
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-slate-100 dark:border-slate-800 ${
            desktopCollapsed ? 'justify-center px-2' : 'justify-between px-[18px]'
          }`}
        >
          {desktopCollapsed ? (
            <button
              type="button"
              onClick={() => setDesktopCollapsed(false)}
              aria-label="Mostrar menu de navegação"
              title="Mostrar menu de navegação"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <Icon name="menu" className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : (
            <>
              <Logo />
              <button
                type="button"
                onClick={() => setDesktopCollapsed(true)}
                aria-label="Esconder menu de navegação"
                title="Esconder menu de navegação"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Icon name="menu" className="h-5 w-5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">{nav(desktopCollapsed)}</div>
        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            title={desktopCollapsed ? 'Mostrar menu de navegação' : 'Esconder menu de navegação'}
            className={`flex w-full items-center gap-2 rounded-[9px] border border-slate-200 px-3 py-2 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${
              desktopCollapsed ? 'justify-center' : ''
            }`}
          >
            {desktopCollapsed ? (
              <span aria-hidden="true" className="text-base leading-none">
                »
              </span>
            ) : (
              <>
                <Icon name="chevron-down" strokeWidth={2.5} className="h-4 w-4 shrink-0 rotate-90" />
                <span>Recolher menu</span>
              </>
            )}
          </button>
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
            {nav(false, () => setOpen(false))}
          </aside>
        </div>
      )}
    </>
  )
}
