'use client'

import { useEffect, useState } from 'react'

// Gráficos (Recharts) recebem cor via prop JS, não classe Tailwind — não dá pra
// usar `dark:` ali. Esse hook expõe o tema atual (definido pelo <html class="dark">,
// ver ThemeToggle) pra quem precisa recalcular grid/eixo/tooltip na mão.
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    setIsDark(root.classList.contains('dark'))

    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}
