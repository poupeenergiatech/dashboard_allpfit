'use client'

import { useMemo, useState, useTransition } from 'react'
import { deleteAcademia, setAcademiaActive, updateAcademia } from '@/app/(app)/academias/actions'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { useToast } from '@/components/ui/toast'
import type { AcademiaAdmin } from '@/lib/dashboard/fetch-academias'

type ToggleAction = (academiaId: string, ativo: boolean) => Promise<void>
type UpdateAction = (academiaId: string, formData: FormData) => Promise<void>
type DeleteAction = (academiaId: string) => Promise<void>
type StatusFilter = 'todas' | 'ativas' | 'inativas'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'ativas', label: 'Ativas' },
  { value: 'inativas', label: 'Inativas' },
]

export function AcademiasTable({
  academias,
  onToggleActive = setAcademiaActive,
  onUpdate = updateAcademia,
  onDelete = deleteAcademia,
}: {
  academias: AcademiaAdmin[]
  onToggleActive?: ToggleAction
  onUpdate?: UpdateAction
  onDelete?: DeleteAction
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todas')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return academias.filter((a) => {
      if (status === 'ativas' && !a.ativo) return false
      if (status === 'inativas' && a.ativo) return false
      if (term && !a.nome.toLowerCase().includes(term)) return false
      return true
    })
  }, [academias, search, status])

  if (academias.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma academia cadastrada ainda.</div>
  }

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome…"
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhuma academia encontrada pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Número WhatsApp</th>
                <th className="px-4 py-3 text-right">Total de alunos</th>
                <th className="px-4 py-3">Ativa</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) =>
                editingId === a.id ? (
                  <AcademiaEditRow
                    key={a.id}
                    academia={a}
                    onUpdate={onUpdate}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                ) : (
                  <AcademiaRow
                    key={a.id}
                    academia={a}
                    onToggleActive={onToggleActive}
                    onDelete={onDelete}
                    onEdit={() => setEditingId(a.id)}
                  />
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AcademiaRow({
  academia,
  onToggleActive,
  onDelete,
  onEdit,
}: {
  academia: AcademiaAdmin
  onToggleActive: ToggleAction
  onDelete: DeleteAction
  onEdit: () => void
}) {
  const [ativo, setAtivo] = useState(academia.ativo)
  const [pending, startTransition] = useTransition()
  const [deleting, startDeleteTransition] = useTransition()
  const { showToast } = useToast()

  function toggle() {
    if (pending) return
    const next = !ativo
    setAtivo(next)
    startTransition(async () => {
      try {
        await onToggleActive(academia.id, next)
        showToast(next ? `${academia.nome} reativada.` : `${academia.nome} desativada.`)
      } catch (err) {
        setAtivo(!next)
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error')
      }
    })
  }

  function handleDelete() {
    if (deleting) return
    if (!window.confirm(`Excluir "${academia.nome}" definitivamente? Essa ação não pode ser desfeita.`)) {
      return
    }
    startDeleteTransition(async () => {
      try {
        await onDelete(academia.id)
        showToast(`${academia.nome} excluída.`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao excluir.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
      <td className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={academia.nome} />
          <span className="text-slate-900 dark:text-white">{academia.nome}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{academia.numeroTelefone ?? '—'}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{academia.totalAlunos}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          disabled={pending}
          onClick={toggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
            ativo ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-slate-900 shadow transition-all ${
              ativo ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-xs font-medium">
          <button type="button" onClick={onEdit} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            Editar
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 disabled:opacity-50"
          >
            {deleting ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </td>
    </tr>
  )
}

function AcademiaEditRow({
  academia,
  onUpdate,
  onCancel,
  onSaved,
}: {
  academia: AcademiaAdmin
  onUpdate: UpdateAction
  onCancel: () => void
  onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        await onUpdate(academia.id, formData)
        showToast('Academia atualizada.')
        onSaved()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar academia.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/70 last:border-0">
      <td className="px-4 py-3" colSpan={5}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor={`nome-${academia.id}`}>
              Nome da unidade
            </label>
            <input
              id={`nome-${academia.id}`}
              name="nome"
              type="text"
              required
              defaultValue={academia.nome}
              className="input"
            />
          </div>
          <div className="flex-1">
            <label className="field-label" htmlFor={`numero-${academia.id}`}>
              Número de WhatsApp
            </label>
            <input
              id={`numero-${academia.id}`}
              name="numero_telefone"
              type="text"
              defaultValue={academia.numeroTelefone ?? ''}
              className="input"
            />
          </div>
          <div className="w-32">
            <label className="field-label" htmlFor={`total-alunos-${academia.id}`}>
              Total de alunos
            </label>
            <input
              id={`total-alunos-${academia.id}`}
              name="total_alunos"
              type="number"
              min={0}
              defaultValue={academia.totalAlunos}
              className="input"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}
