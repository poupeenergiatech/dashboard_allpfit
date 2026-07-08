import { MarkSignedButton } from './mark-signed-button'
import type { PendingSignature } from '@/lib/dashboard/fetch-pendentes'

export function PendentesList({ rows, canEdit }: { rows: PendingSignature[]; canEdit: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Nenhuma pendência de assinatura.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{row.nome}</p>
            <p className="text-xs text-slate-500">
              {row.academiaNome} · contato em {new Date(row.dataContato).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {canEdit && <MarkSignedButton id={row.id} nome={row.nome} />}
        </li>
      ))}
    </ul>
  )
}
