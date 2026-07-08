'use client'

export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p className="font-medium">Não foi possível carregar esta página.</p>
      <p className="mt-1 text-red-600">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        Tentar novamente
      </button>
    </div>
  )
}
