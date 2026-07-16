'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/icons'

const STORAGE_KEY = 'allpfit-theme'

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
}

// A classe real é aplicada por um script inline no <head> (ver root layout),
// que roda antes da primeira pintura pra não piscar claro->escuro. Este
// componente só lê o estado já aplicado no <html> pra manter o ícone em sincronia.
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  if (dark === null) {
    return <span className="h-9 w-9 shrink-0 rounded-xl" aria-hidden="true" />
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDark((prev) => {
          const next = !prev
          applyTheme(next)
          return next
        })
      }}
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      <Icon name={dark ? 'sun' : 'moon'} className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </button>
  )
}
