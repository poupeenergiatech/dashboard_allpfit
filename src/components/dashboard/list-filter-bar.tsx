'use client'

// Barra de filtro genérica (busca texto + pills de status) reutilizada pelas telas
// de listagem que já carregam a lista inteira de uma vez (academias, números,
// treinadas, usuários, histórico de sync) — filtro em JS no client, sem round-trip
// ao servidor, já que são listas pequenas (dezenas de linhas, não milhares).
export function ListFilterBar<TStatus extends string>({
  search,
  onSearchChange,
  searchPlaceholder,
  statusOptions,
  status,
  onStatusChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  statusOptions: { value: TStatus; label: string }[]
  status: TStatus
  onStatusChange: (value: TStatus) => void
}) {
  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="input sm:max-w-xs"
      />
      {statusOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              aria-pressed={status === opt.value}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                status === opt.value
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
