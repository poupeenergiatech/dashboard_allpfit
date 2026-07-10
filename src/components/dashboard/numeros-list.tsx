import { Avatar } from '@/components/ui/avatar'
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
    <div className="space-y-3">
      {rows.map((group) => (
        <NumeroGroupCard key={group.numeroTelefone ?? group.unidades[0].academiaId} group={group} />
      ))}
    </div>
  )
}

function NumeroGroupCard({ group }: { group: NumeroGroup }) {
  const unidadeCount = group.unidades.length

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="shrink-0 text-sm text-slate-600">
          <span className="font-semibold tabular-nums text-slate-900">{group.mensagensHoje}</span> mensagens hoje
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {group.unidades.map((unidade) => (
          <div
            key={unidade.academiaId}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 py-1.5 pl-1.5 pr-3 transition hover:bg-slate-100/70"
          >
            <Avatar name={unidade.nome} className="h-6 w-6 text-[10px]" />
            <span className="text-sm font-medium text-slate-700">{unidade.nome}</span>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${unidade.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}
              title={unidade.ativo ? 'Ativa' : 'Inativa'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
