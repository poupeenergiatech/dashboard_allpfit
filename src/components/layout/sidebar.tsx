'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { UserRole } from '@/lib/supabase/profile'

const NAV_ITEMS: { label: string; href: string; roles?: UserRole[] }[] = [
  { label: 'Funil / Dashboard', href: '/' },
  { label: 'Performance por Academia', href: '/performance' },
  { label: 'Pendentes de Assinatura', href: '/pendentes' },
  { label: 'Números (WhatsApp)', href: '/numeros' },
  { label: 'Academias Treinadas', href: '/treinadas' },
  { label: 'Usuários', href: '/usuarios', roles: ['super_admin'] },
]

export function Sidebar({ role }: { role: UserRole | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const items = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)))

  // Fecha o drawer automaticamente ao navegar (evita ficar aberto por cima da
  // página seguinte em telas pequenas).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
              active ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-lg font-bold text-blue-800">Allp Fit</span>
        </div>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
              <span className="text-lg font-bold text-blue-800">Allp Fit</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="text-xl leading-none text-slate-400"
              >
                ×
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  )
}
