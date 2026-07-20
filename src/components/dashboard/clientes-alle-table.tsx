'use client'

import { useMemo, useState, useTransition } from 'react'
import { deleteClienteAlle, updateClienteAlle } from '@/app/(app)/clientes-alle/actions'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'
import type { ClienteAlle } from '@/lib/dashboard/fetch-clientes-alle'

type UpdateAction = (clienteId: string, formData: FormData) => Promise<void>
type DeleteAction = (clienteId: string) => Promise<void>
type StatusFilter = 'todos' | 'ativos' | 'pendentes'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'pendentes', label: 'Pendentes' },
]

export function ClientesAlleTable({
  clientes,
  academias,
  editable = true,
  onUpdate = updateClienteAlle,
  onDelete = deleteClienteAlle,
}: {
  clientes: ClienteAlle[]
  academias: Academia[]
  editable?: boolean
  onUpdate?: UpdateAction
  onDelete?: DeleteAction
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [deleting, startDeleteTransition] = useTransition()
  const { showToast } = useToast()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return clientes.filter((c) => {
      if (status === 'ativos' && c.status !== 'ativo') return false
      if (status === 'pendentes' && c.status !== 'pendente') return false
      if (term && !c.nome.toLowerCase().includes(term)) return false
      return true
    })
  }, [clientes, search, status])

  function handleDelete(cliente: ClienteAlle) {
    if (deleting) return
    if (!window.confirm(`Excluir "${cliente.nome}" definitivamente? Essa ação não pode ser desfeita.`)) return
    startDeleteTransition(async () => {
      try {
        await onDelete(cliente.id)
        showToast(`${cliente.nome} excluído.`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao excluir cliente.', 'error')
      }
    })
  }

  if (clientes.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente Alle cadastrado ainda.</div>
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
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente encontrado pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 px-4 py-3">Nome</th>
                <th className="px-4 py-3">Academia</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                {editable && <th className="px-4 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) =>
                editable && editingId === c.id ? (
                  <ClienteAlleEditRow
                    key={c.id}
                    cliente={c}
                    academias={academias}
                    onUpdate={onUpdate}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                    <td className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.nome} />
                        <span className="text-slate-900 dark:text-white">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.academiaNome}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.telefone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.status === 'ativo' ? (
                        <span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Ativo</span>
                      ) : (
                        <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">Pendente</span>
                      )}
                    </td>
                    {editable && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => setEditingId(c.id)}
                            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={deleting}
                            onClick={() => handleDelete(c)}
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ClienteAlleEditRow({
  cliente,
  academias,
  onUpdate,
  onCancel,
  onSaved,
}: {
  cliente: ClienteAlle
  academias: Academia[]
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
        await onUpdate(cliente.id, formData)
        showToast('Cliente atualizado.')
        onSaved()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar cliente.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/70 last:border-0">
      <td className="px-4 py-3" colSpan={6}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div className="lg:col-span-2">
            <label className="field-label" htmlFor={`nome-${cliente.id}`}>
              Nome
            </label>
            <input id={`nome-${cliente.id}`} name="nome" type="text" required defaultValue={cliente.nome} className="input" />
          </div>

          <div>
            <label className="field-label" htmlFor={`academia-${cliente.id}`}>
              Academia
            </label>
            <select
              id={`academia-${cliente.id}`}
              name="academia_id"
              required
              defaultValue={cliente.academiaId}
              className="select"
            >
              {academias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor={`telefone-${cliente.id}`}>
              Telefone
            </label>
            <input
              id={`telefone-${cliente.id}`}
              name="telefone"
              type="text"
              defaultValue={cliente.telefone ?? ''}
              className="input"
            />
          </div>

          <div>
            <label className="field-label" htmlFor={`email-${cliente.id}`}>
              Email
            </label>
            <input id={`email-${cliente.id}`} name="email" type="email" defaultValue={cliente.email ?? ''} className="input" />
          </div>

          <div>
            <label className="field-label" htmlFor={`status-${cliente.id}`}>
              Status
            </label>
            <select id={`status-${cliente.id}`} name="status" defaultValue={cliente.status} className="select">
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente de assinatura</option>
            </select>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:col-span-6">
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
