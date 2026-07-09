import { Avatar } from '@/components/ui/avatar'
import { MarkSignedButton } from './mark-signed-button'
import type { PendingSignature } from '@/lib/dashboard/fetch-pendentes'

export function PendentesList({
  rows,
  canEdit,
  onConfirm,
  onMarked,
}: {
  rows: PendingSignature[]
  canEdit: boolean
  onConfirm?: (id: string) => Promise<void>
  onMarked?: (id: string) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500">
        Nenhuma pendência de assinatura.
      </div>
    )
  }

  return (
    <ul className="card divide-y divide-slate-50">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-slate-50/70"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={row.nome} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{row.nome}</p>
              <p className="truncate text-xs text-slate-500">
                {row.academiaNome} · contato em {new Date(row.dataContato).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {canEdit && (
            <MarkSignedButton
              id={row.id}
              nome={row.nome}
              onConfirm={onConfirm}
              onSuccess={() => onMarked?.(row.id)}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
