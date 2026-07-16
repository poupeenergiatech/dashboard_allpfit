'use client'

import { useTransition } from 'react'
import { deleteAcademiaAlias } from '@/app/(app)/academias/actions'
import { useToast } from '@/components/ui/toast'
import type { AcademiaAlias } from '@/lib/dashboard/fetch-academias'

type DeleteAliasAction = (aliasId: string) => Promise<void>

export function AcademiaAliasesSection({
  aliases,
  onDelete = deleteAcademiaAlias,
}: {
  aliases: AcademiaAlias[]
  onDelete?: DeleteAliasAction
}) {
  if (aliases.length === 0) return null

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Nomes alternativos vinculados</h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Nomes de unidade vindos do Alle Documentos que não batiam com o cadastro — vinculados manualmente pela tela
        de sincronização em Configurações.
      </p>
      <div className="card divide-y divide-slate-50 dark:divide-slate-800">
        {aliases.map((alias) => (
          <AliasRow key={alias.id} alias={alias} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

function AliasRow({ alias, onDelete }: { alias: AcademiaAlias; onDelete: DeleteAliasAction }) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleDelete() {
    if (pending) return
    if (!window.confirm(`Remover o vínculo de "${alias.aliasNome}" com "${alias.academiaNome}"?`)) return

    startTransition(async () => {
      try {
        await onDelete(alias.id)
        showToast('Vínculo removido.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao remover vínculo.', 'error')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <span className="text-slate-900 dark:text-white">{alias.aliasNome}</span>
        <span className="mx-2 text-slate-400 dark:text-slate-500">→</span>
        <span className="text-slate-600 dark:text-slate-300">{alias.academiaNome}</span>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-800 disabled:opacity-50"
      >
        {pending ? 'Removendo…' : 'Remover'}
      </button>
    </div>
  )
}
