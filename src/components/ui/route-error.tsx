'use client'

export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 dark:border-red-500/20 bg-red-50/70 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-400">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </span>
        <div>
          <p className="font-semibold text-red-800 dark:text-red-400">Não foi possível carregar esta página.</p>
          <p className="mt-1 text-red-600/90 dark:text-red-400/90">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 rounded-xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-red-700 dark:text-red-400 shadow-sm transition hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  )
}
