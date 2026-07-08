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
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-medium text-emerald-700">AO VIVO</span>
      {secondsAgo !== null && (
        <span>· atualizado há {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}min`}</span>
      )}
    </div>
  )
}
