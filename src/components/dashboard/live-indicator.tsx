'use client'

import { useEffect, useState } from 'react'

export function LiveIndicator({ lastUpdatedAt }: { lastUpdatedAt: Date | null }) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const secondsAgo = lastUpdatedAt
    ? Math.max(0, Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000))
    : null

  return (
    <div
      title="Os números atualizam sozinhos a cada poucos segundos — não precisa recarregar a página."
      className="inline-flex items-center gap-2 rounded-full border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">AO VIVO</span>
      {secondsAgo !== null && (
        <span className="text-emerald-600/70 dark:text-emerald-400/70">
          · atualizado há {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}min`}
        </span>
      )}
    </div>
  )
}
