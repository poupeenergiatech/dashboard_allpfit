import type { NumeroGroup } from '@/lib/dashboard/fetch-numeros'

export function NumerosList({ rows }: { rows: NumeroGroup[] }) {
  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500">
        Nenhuma academia cadastrada ainda.
      </div>
    )
  }

  return (
    <div className="card divide-y divide-slate-50">
      {rows.map((group) => (
        <NumeroRow key={group.numeroTelefone ?? group.unidades[0].academiaId} group={group} />
      ))}
    </div>
  )
}

function NumeroRow({ group }: { group: NumeroGroup }) {
  const unidadeCount = group.unidades.length

  return (
    <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums text-slate-900">
            {group.numeroTelefone ?? 'Número não configurado'}
          </span>
          <span className="badge bg-blue-50 text-blue-700">
            {unidadeCount} {unidadeCount === 1 ? 'unidade' : 'unidades'}
          </span>
          <span
            className={`badge ${group.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
          >
            <span className={`badge-dot ${group.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {group.ativo ? 'Online' : 'Offline'}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">{group.unidades.map((u) => u.nome).join(', ')}</p>
      </div>

      <div className="shrink-0 text-sm text-slate-600 sm:text-right">
        <span className="font-semibold tabular-nums text-slate-900">{group.mensagensHoje}</span> mensagens hoje
      </div>
    </div>
  )
}
