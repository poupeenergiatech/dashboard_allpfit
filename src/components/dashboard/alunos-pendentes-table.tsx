'use client'

import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { ListFilterBar } from './list-filter-bar'
import { Pagination } from './pagination'
import { downloadCsv, toCsv } from '@/lib/dashboard/csv'
import { matchesNomeOuTelefone } from '@/lib/dashboard/search-match'
import type { ClienteAlle } from '@/lib/dashboard/fetch-clientes-alle'

const PAGE_SIZE = 15

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// Lista nominal, só leitura, de quem está com status 'pendente' em clientes_alle
// — usada em /pendentes pra Gestor (ver canViewAlunosPendentesList em
// profile.ts), que não tem acesso à tela de gestão completa (/clientes-alle).
// Sem edição/exclusão/reprovação de propósito, mesma regra pra qualquer role
// que venha a usar este componente no futuro: aqui é só consulta, gerenciar
// continua exclusivo de /clientes-alle.
export function AlunosPendentesTable({ clientes }: { clientes: ClienteAlle[] }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => clientes.filter((c) => matchesNomeOuTelefone(search, c.nome, c.telefone)),
    [clientes, search]
  )

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleExport() {
    const header = ['Nome', 'Academia', 'Telefone', 'Email', 'Pendente desde']
    const dataRows = filtered.map((c) => [
      c.nome,
      c.academiaNome,
      c.telefone ?? '',
      c.email ?? '',
      formatDate(c.createdAt),
    ])
    downloadCsv(`alunos-pendentes-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([header, ...dataRows]))
  }

  if (clientes.length === 0) {
    return (
      <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
        Nenhum aluno pendente de assinatura por aqui.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ListFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou telefone…"
        statusOptions={[]}
        status="todos"
        onStatusChange={() => {}}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length === clientes.length ? (
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{clientes.length}</span>{' '}
              {clientes.length === 1 ? 'aluno pendente' : 'alunos pendentes'}
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> de{' '}
              {clientes.length} {clientes.length === 1 ? 'aluno pendente' : 'alunos pendentes'}
            </>
          )}
        </p>
        <button type="button" onClick={handleExport} className="btn-secondary btn-sm">
          Exportar CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">
          Nenhum aluno encontrado pra essa busca.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                <th className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/95 px-4 py-3">
                  Nome
                </th>
                <th className="px-4 py-3">Academia</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Pendente desde</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                >
                  <td className="sticky left-0 z-10 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.nome} />
                      <span className="text-slate-900 dark:text-white">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.academiaNome}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.telefone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                    {formatDate(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
