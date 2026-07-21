'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  desfazerReprovacaoClienteConvertido,
  promoverClienteConvertido,
  reprovarClienteConvertido,
  updateClienteConvertidoAcademia,
} from '@/app/(app)/convertidos/actions'
import { reprovarClienteAlle } from '@/app/(app)/clientes-alle/actions'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { Pagination } from './pagination'
import { useToast } from '@/components/ui/toast'
import type { Academia } from '@/lib/dashboard/types'
import type { ClienteConvertido } from '@/lib/dashboard/fetch-clientes-convertidos'

type StatusFilter = 'todos' | 'sem_unidade'
type UpdateAction = (conversionId: string, formData: FormData) => Promise<void>
type PromoteAction = (conversionId: string) => Promise<void>
type ReprovarAction = (id: string) => Promise<void>

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'sem_unidade', label: 'Sem unidade' },
]

const PAGE_SIZE = 15

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function ClientesConvertidosTable({
  clientes,
  academias,
  editable = true,
  onUpdate = updateClienteConvertidoAcademia,
  onPromote = promoverClienteConvertido,
  onReprovarAne = reprovarClienteConvertido,
  onDesfazerReprovacaoAne = desfazerReprovacaoClienteConvertido,
  onReprovarManual = reprovarClienteAlle,
}: {
  clientes: ClienteConvertido[]
  academias: Academia[]
  editable?: boolean
  onUpdate?: UpdateAction
  onPromote?: PromoteAction
  onReprovarAne?: ReprovarAction
  onDesfazerReprovacaoAne?: ReprovarAction
  onReprovarManual?: ReprovarAction
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return clientes.filter((c) => {
      if (status === 'sem_unidade' && c.academiaId !== null) return false
      if (term && !(c.nome ?? '').toLowerCase().includes(term)) return false
      return true
    })
  }, [clientes, search, status])

  useEffect(() => {
    setPage(1)
  }, [search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const semUnidadeCount = clientes.filter((c) => c.academiaId === null).length

  if (clientes.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente convertido ainda.</div>
  }

  const columnCount = editable ? 7 : 5

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome…"
        statusOptions={semUnidadeCount > 0 ? STATUS_OPTIONS : []}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum cliente encontrado pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Academia</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Convertido em</th>
                {editable && <th className="px-4 py-3">Termo de adesão</th>}
                {editable && <th className="px-4 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) =>
                editable && c.origem === 'ane' && editingId === c.id ? (
                  <ClienteConvertidoEditRow
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
                    <td className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.nome ?? '?'} />
                        <span className="text-slate-900 dark:text-white">{c.nome ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.telefone ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.academiaNome ? (
                        <span className="text-slate-600 dark:text-slate-300">{c.academiaNome}</span>
                      ) : (
                        <span
                          className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          title="unidade_allpfit em branco no Alle Documentos — corrija na origem pra vincular."
                        >
                          Sem unidade
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.origem === 'ane' ? (
                        <span className="badge bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300">Ane</span>
                      ) : (
                        <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">{formatDate(c.createdAt)}</td>
                    {editable && (
                      <td className="px-4 py-3">
                        {c.status === 'ativo' ? (
                          <span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            Cliente Alle ativo
                          </span>
                        ) : c.status === 'pendente' ? (
                          <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">Pendente</span>
                        ) : c.status === 'reprovado' ? (
                          <span className="badge bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">Reprovado</span>
                        ) : c.status === 'sem_informacao' ? (
                          <span className="badge bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300">Sem informação</span>
                        ) : c.academiaId ? (
                          <PromoverButton clienteId={c.id} nome={c.nome} onPromote={onPromote} />
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500" title="Defina a academia antes de marcar como assinado.">
                            —
                          </span>
                        )}
                      </td>
                    )}
                    {editable && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs font-medium">
                          {c.origem === 'ane' && c.academiaId === null && (
                            <button
                              type="button"
                              onClick={() => setEditingId(c.id)}
                              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                              Editar
                            </button>
                          )}
                          {c.origem === 'ane' && c.status === 'reprovado' && (
                            <ReprovarButton
                              id={c.id}
                              nome={c.nome}
                              label="Desfazer"
                              confirmText={`Desfazer a reprovação de ${c.nome ?? 'esse cliente'}?`}
                              pendingLabel="Desfazendo…"
                              successMessage="Reprovação desfeita."
                              errorMessage="Erro ao desfazer reprovação."
                              onReprovar={onDesfazerReprovacaoAne}
                            />
                          )}
                          {c.origem === 'ane' && c.status === null && (
                            <ReprovarButton
                              id={c.id}
                              nome={c.nome}
                              label="Reprovar"
                              confirmText={`Reprovar/cancelar ${c.nome ?? 'esse cliente'}?`}
                              pendingLabel="Reprovando…"
                              successMessage="Cliente marcado como reprovado."
                              errorMessage="Erro ao reprovar cliente."
                              onReprovar={onReprovarAne}
                            />
                          )}
                          {c.origem === 'manual' && c.status !== 'reprovado' && (
                            <ReprovarButton
                              id={c.id}
                              nome={c.nome}
                              label="Reprovar"
                              confirmText={`Reprovar/cancelar ${c.nome ?? 'esse cliente'}?`}
                              pendingLabel="Reprovando…"
                              successMessage="Cliente marcado como reprovado."
                              errorMessage="Erro ao reprovar cliente."
                              onReprovar={onReprovarManual}
                            />
                          )}
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

function PromoverButton({
  clienteId,
  nome,
  onPromote,
}: {
  clienteId: string
  nome: string | null
  onPromote: PromoteAction
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleClick() {
    if (pending) return
    if (!window.confirm(`Confirmar que ${nome ?? 'esse cliente'} assinou o termo de adesão e virou cliente Alle ativo?`)) {
      return
    }
    startTransition(async () => {
      try {
        await onPromote(clienteId)
        showToast('Cliente marcado como Alle ativo.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao marcar como assinado.', 'error')
      }
    })
  }

  return (
    <button type="button" disabled={pending} onClick={handleClick} className="btn-outline-success btn-sm disabled:opacity-50">
      {pending ? 'Marcando…' : 'Assinou o termo'}
    </button>
  )
}

// Reutilizado pra reprovar (ane e manual) e pra desfazer reprovação (só ane, que não
// tem outro lugar pra voltar atrás — manual pode ser editado de novo em
// /clientes-alle).
function ReprovarButton({
  id,
  nome,
  label,
  confirmText,
  pendingLabel,
  successMessage,
  errorMessage,
  onReprovar,
}: {
  id: string
  nome: string | null
  label: string
  confirmText: string
  pendingLabel: string
  successMessage: string
  errorMessage: string
  onReprovar: ReprovarAction
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleClick() {
    if (pending) return
    if (!window.confirm(confirmText)) return
    startTransition(async () => {
      try {
        await onReprovar(id)
        showToast(successMessage)
      } catch (err) {
        showToast(err instanceof Error ? err.message : errorMessage, 'error')
      }
    })
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 disabled:opacity-50"
      title={nome ?? undefined}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

// Só existe pra linhas "sem unidade" (academiaId null) — ver a nota em
// convertidos/actions.ts sobre por que essa é a única forma de corrigir depois que
// o sync já inseriu o registro.
function ClienteConvertidoEditRow({
  cliente,
  academias,
  columnCount,
  onUpdate,
  onCancel,
  onSaved,
}: {
  cliente: ClienteConvertido
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
        showToast('Cliente convertido atualizado.')
        onSaved()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao atualizar cliente convertido.', 'error')
      }
    })
  }

  return (
    <tr className="border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/70 last:border-0">
      <td className="px-4 py-3" colSpan={columnCount}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="lg:col-span-2">
            <label className="field-label" htmlFor={`nome-${cliente.id}`}>
              Nome
            </label>
            <input id={`nome-${cliente.id}`} name="nome" type="text" defaultValue={cliente.nome ?? ''} className="input" />
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
            <label className="field-label" htmlFor={`academia-${cliente.id}`}>
              Academia
            </label>
            <select id={`academia-${cliente.id}`} name="academia_id" required defaultValue="" className="select">
              <option value="" disabled>
                Selecione…
              </option>
              {academias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:col-span-5">
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
