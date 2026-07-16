const PALETTE = [
  'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-cyan-50 text-cyan-600',
]

function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? '?'
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorFor(name)} ${className}`}
    >
      {initial}
    </span>
  )
}
