'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  bulkDeleteClientesAlle,
  bulkUpdateClientesAlleStatus,
  deleteClienteAlle,
  reprovarClienteAlle,
  updateClienteAlle,
} from '@/app/(app)/clientes-alle/actions'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { Pagination } from './pagination'
import { useToast } from '@/components/ui/toast'
import { matchesNomeOuTelefone } from '@/lib/dashboard/search-match'
import type { Academia } from '@/lib/dashboard/types'
import type { ClienteAlle, ClienteAlleStatus } from '@/lib/dashboard/fetch-clientes-alle'

type UpdateAction = (clienteId: string, formData: FormData) => Promise<void>
type DeleteAction = (clienteId: string) => Promise<void>
type ReprovarAction = (clienteId: string) => Promise<void>
type BulkUpdateAction = (clienteIds: string[], status: ClienteAlleStatus) => Promise<void>
type BulkDeleteAction = (clienteIds: string[]) => Promise<void>
type StatusFilter = 'todos' | 'ativos' | 'pendentes' | 'reprovados' | 'sem_informacao'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'reprovados', label: 'Reprovados' },
  { value: 'sem_informacao', label: 'Sem informação' },
]

const PAGE_SIZE = 15

export function ClientesAlleTable({
  clientes,
  academias,
  editable = true,
  onUpdate = updateClienteAlle,
  onDelete = deleteClienteAlle,
  onReprovar = reprovarClienteAlle,
  onBulkUpdateStatus = bulkUpdateClientesAlleStatus,
  onBulkDelete = bulkDeleteClientesAlle,
}: {
  clientes: ClienteAlle[]
  academias: Academia[]
  editable?: boolean
  onUpdate?: UpdateAction
  onDelete?: DeleteAction
  onReprovar?: ReprovarAction
  onBulkUpdateStatus?: BulkUpdateAction
  onBulkDelete?: BulkDeleteAction
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<ClienteAlleStatus>('ativo')
  const [rowActionPending, startRowActionTransition] = useTransition()
  const [bulkPending, startBulkTransition] = useTransition()
  const { showToast } = useToast()

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      if (status === 'ativos' && c.status !== 'ativo') return false
      if (status === 'pendentes' && c.status !== 'pendente') return false
      if (status === 'reprovados' && c.status !== 'reprovado') return false
      if (status === 'sem_informacao' && c.status !== 'sem_informacao') return false
      if (!matchesNomeOuTelefone(search, c.nome, c.telefone)) return false
      return true
    })
  }, [clientes, search, status])

  // Paginação/busca/filtro andam juntas — trocar qualquer uma volta pra página 1,
  // senão dá pra ficar numa página vazia (ex.: filtrar por "Pendentes" com a
  // página 3 selecionada, mas só ter 1 página de pendentes).
  useEffect(() => {
    setPage(1)
  }, [search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Seleção é por id, independente da página — marcar alguém, trocar de página e
  // marcar mais gente permite montar um lote maior que os 15 da página atual.
  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const c of filtered) next.delete(c.id)
      } else {
        for (const c of filtered) next.add(c.id)
      }
      return next
    })
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDelete(cliente: ClienteAlle) {
    if (rowActionPending) return
    if (!window.confirm(`Excluir "${cliente.nome}" definitivamente? Essa ação não pode ser desfeita.`)) return
    startRowActionTransition(async () => {
      try {
        await onDelete(cliente.id)
        showToast(`${cliente.nome} excluído.`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao excluir cliente.', 'error')
      }
    })
  }

  function handleBulkStatus() {
    if (bulkPending || selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    startBulkTransition(async () => {
      try {
        await onBulkUpdateStatus(ids, bulkStatus)
        showToast(`${ids.length} cliente(s) atualizado(s).`)
        setSelectedIds(new Set())
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar clientes.', 'error')
      }
    })
  }

  function handleReprovar(cliente: ClienteAlle) {
    if (rowActionPending) return
    if (!window.confirm(`Reprovar/cancelar "${cliente.nome}"?`)) return
    startRowActionTransition(async () => {
      try {
        await onReprovar(cliente.id)
        showToast(`${cliente.nome} marcado como reprovado.`)
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao reprovar cliente.', 'error')
      }
    })
  }

  function handleBulkDelete() {
    if (bulkPending || selectedIds.size === 0) return
    if (
      !window.confirm(
        `Excluir ${selectedIds.size} cliente(s) selecionado(s) definitivamente? Essa ação não pode ser desfeita.`
      )
    ) {
      return
    }
    const ids = Array.from(selectedIds)
    startBulkTransition(async () => {
      try {
        await onBulkDelete(ids)
        showToast(`${ids.length} cliente(s) excluído(s).`)
        setSelectedIds(new Set())
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao excluir clientes.', 'error')
      }
    })
  }

  if (clientes.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente Alle cadastrado ainda.</div>
  }

  const columnCount = editable ? 7 : 5

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou telefone…"
        statusOptions={STATUS_OPTIONS}
        status={status}
        onStatusChange={setStatus}
      />

      {editable && selectedIds.size > 0 && (
        <div className="card flex flex-wrap items-center gap-3 p-4 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">{selectedIds.size} selecionado(s)</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ClienteAlleStatus)}
            className="select h-9 w-auto py-0 text-xs"
          >
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente de assinatura</option>
            <option value="reprovado">Reprovado</option>
            <option value="sem_informacao">Sem informação</option>
          </select>
          <button type="button" disabled={bulkPending} onClick={handleBulkStatus} className="btn-secondary btn-sm">
            {bulkPending ? 'Aplicando…' : 'Aplicar status'}
          </button>
          <button type="button" disabled={bulkPending} onClick={handleBulkDelete} className="btn-ghost-danger btn-sm">
            Excluir selecionados
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente encontrado pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {editable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                    />
                  </th>
                )}
                <th className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 px-4 py-3">Nome</th>
                <th className="px-4 py-3">Academia</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                {editable && <th className="px-4 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) =>
                editable && editingId === c.id ? (
                  <ClienteAlleEditRow
                    key={c.id}
                    cliente={c}
                    academias={academias}
                    columnCount={columnCount}
                    onUpdate={onUpdate}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                    {editable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          aria-label={`Selecionar ${c.nome}`}
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                        />
                      </td>
                    )}
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
                      ) : c.status === 'reprovado' ? (
                        <span className="badge bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">Reprovado</span>
                      ) : c.status === 'sem_informacao' ? (
                        <span className="badge bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300">Sem informação</span>
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
                          {c.status !== 'reprovado' && (
                            <button
                              type="button"
                              disabled={rowActionPending}
                              onClick={() => handleReprovar(c)}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 disabled:opacity-50"
                            >
                              Reprovar
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={rowActionPending}
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

function ClienteAlleEditRow({
  cliente,
  academias,
  columnCount,
  onUpdate,
  onCancel,
  onSaved,
}: {
  cliente: ClienteAlle
  academias: Academia[]
  columnCount: number
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
      <td className="px-4 py-3" colSpan={columnCount}>
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
              <option value="reprovado">Reprovado</option>
              <option value="sem_informacao">Sem informação</option>
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
