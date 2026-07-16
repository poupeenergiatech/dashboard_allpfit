'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type MobileNavContextValue = { open: boolean; setOpen: (open: boolean) => void }

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

// Estado do drawer mobile compartilhado entre o botão (no Topbar) e o próprio
// drawer (na Sidebar) — antes os dois viviam juntos dentro da Sidebar, o que
// forçava o Topbar a reservar um espaço fixo (pl-16) pra um botão posicionado
// de forma independente por cima dele.
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext)
  if (!ctx) throw new Error('useMobileNav precisa estar dentro de um MobileNavProvider')
  return ctx
}
