'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { UserRole } from '@/lib/auth/profile'

const NAV_ITEMS: { label: string; href: string; roles?: UserRole[]; icon: IconName }[] = [
  { label: 'Funil / Dashboard', href: '', icon: 'chart' },
  { label: 'Performance por Academia', href: '/performance', icon: 'bars' },
  { label: 'Scans QR', href: '/scans', icon: 'qr' },
  { label: 'Pendentes de Assinatura', href: '/pendentes', icon: 'pen' },
  { label: 'Números (WhatsApp)', href: '/numeros', icon: 'chat' },
  { label: 'Academias Treinadas', href: '/treinadas', icon: 'badge' },
  { label: 'Academias', href: '/academias', roles: ['super_admin'], icon: 'building' },
  { label: 'Usuários', href: '/usuarios', roles: ['super_admin'], icon: 'users' },
  { label: 'Configurações', href: '/configuracoes', roles: ['super_admin'], icon: 'settings' },
]

type IconName = 'chart' | 'bars' | 'pen' | 'chat' | 'badge' | 'users' | 'settings' | 'building' | 'qr'

function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    chart: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v16a2 2 0 002 2h16M7 15l3.5-4.5 3 3L19 8"
      />
    ),
    bars: <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7" />,
    pen: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.5-9.5a2.121 2.121 0 013 3L12 16l-4 1 1-4 9.5-9.5z"
      />
    ),
    chat: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
      />
    ),
    badge: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.5 2a9.5 9.5 0 11-19 0 9.5 9.5 0 0119 0z"
      />
    ),
    users: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm7 3a4 4 0 00-3-3.87"
      />
    ),
    settings: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
    building: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15m-8 0h16M12 10h7a1 1 0 011 1v10M8 7v.01M8 10v.01M8 13v.01M8 16v.01"
      />
    ),
    qr: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6v-6h-3"
      />
    ),
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      {paths[name]}
    </svg>
  )
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- asset local pequeno e fixo, sem next/image em nenhum outro lugar do app */}
      <img src="/logo.png" alt="" className="h-9 w-9 shrink-0" />
      <span className="leading-tight">
        <span className="block text-[15px] font-bold text-slate-900">Allp Fit</span>
        <span className="block text-[11px] font-medium text-slate-400">Performance</span>
      </span>
    </Link>
  )
}

// basePath permite reusar o mesmo Sidebar/navegação na área autenticada real
// ("") e na rota de prévia com dados fictícios ("/preview").
export function Sidebar({ role, basePath = '' }: { role: UserRole | null; basePath?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)))

  // Fecha o drawer automaticamente ao navegar (evita ficar aberto por cima da
  // página seguinte em telas pequenas).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <NavIcon
                name={item.icon}
                className={`h-[18px] w-[18px] shrink-0 transition ${
                  active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-500'
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo />
        </div>
        {nav()}
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="text-[11px] text-slate-400">Allp Fit × Alle Energia</p>
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
          <aside className="relative flex h-full w-72 flex-col bg-white shadow-2xl animate-fade-up">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {nav(() => setOpen(false))}
          </aside>
        </div>
      )}
    </>
  )
}
