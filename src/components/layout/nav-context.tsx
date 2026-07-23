'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type MobileNavContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  desktopCollapsed: boolean
  setDesktopCollapsed: (collapsed: boolean) => void
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

const COLLAPSED_STORAGE_KEY = 'allpfit-sidebar-collapsed'

// Estado do drawer mobile compartilhado entre o botão (no Topbar) e o próprio
// drawer (na Sidebar) — antes os dois viviam juntos dentro da Sidebar, o que
// forçava o Topbar a reservar um espaço fixo (pl-16) pra um botão posicionado
// de forma independente por cima dele.
//
// desktopCollapsed é o mesmo tipo de estado compartilhado, só que pro botão de
// recolher a sidebar no desktop (>= md) — telas de notebook (~1280-1440px) ficam
// apertadas com sidebar fixa de 256px + conteúdo; guardado em localStorage (lido só
// depois de montar, mesmo padrão do ThemeToggle) pra lembrar a preferência entre
// sessões sem arriscar mismatch de hidratação.
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsedState] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    setDesktopCollapsedState(localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true')
  }, [])

  function setDesktopCollapsed(collapsed: boolean) {
    setDesktopCollapsedState(collapsed)
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed))
  }

  return (
    <MobileNavContext.Provider value={{ open, setOpen, desktopCollapsed, setDesktopCollapsed }}>
      {children}
    </MobileNavContext.Provider>
  )
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext)
  if (!ctx) throw new Error('useMobileNav precisa estar dentro de um MobileNavProvider')
  return ctx
}
