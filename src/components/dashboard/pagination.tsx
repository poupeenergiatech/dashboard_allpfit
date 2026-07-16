'use client'

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
      <span>
        Página <span className="font-medium text-slate-900 dark:text-white">{page}</span> de {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary btn-sm disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary btn-sm disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
