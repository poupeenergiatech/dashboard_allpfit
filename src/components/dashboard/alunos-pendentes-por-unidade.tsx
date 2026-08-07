'use client'

import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Icon } from '@/components/ui/icons'
import { downloadCsv, toCsv } from '@/lib/dashboard/csv'
import { matchesNomeOuTelefone } from '@/lib/dashboard/search-match'
import type { ClienteAlle } from '@/lib/dashboard/fetch-clientes-alle'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

type Grupo = {
  academiaId: string
  academiaNome: string
  clientes: ClienteAlle[]
}

// Lista nominal, só leitura, de quem está com status 'pendente' em clientes_alle
// — agrupada por unidade (pedido explícito do usuário: dava pra comparar uma
// unidade de cada vez pelo filtro do topo da página, mas não pra ver todas de
// uma vez). Usada em /pendentes pra Super Admin, Direção e Gestor (ver
// canViewAlunosPendentesList em profile.ts). Sem edição/exclusão/reprovação
// de propósito, mesma regra pra qualquer role que venha a usar este
// componente no futuro: aqui é só consulta, gerenciar continua exclusivo de
// /clientes-alle.
export function AlunosPendentesPorUnidade({ clientes }: { clientes: ClienteAlle[] }) {
  const [search, setSearch] = useState('')
  // Vazio = tudo aberto por padrão (mais útil de cara com poucas unidades);
  // guarda só quem foi manualmente fechado. Enquanto a busca tá ativa, essa
  // escolha manual fica de lado — toda unidade com resultado abre sozinha (ver
  // "aberta" mais abaixo).
  const [fechadas, setFechadas] = useState<Set<string>>(new Set())

  const grupos = useMemo<Grupo[]>(() => {
    const porAcademia = new Map<string, Grupo>()
    for (const cliente of clientes) {
      const existing = porAcademia.get(cliente.academiaId)
      if (existing) {
        existing.clientes.push(cliente)
      } else {
        porAcademia.set(cliente.academiaId, {
          academiaId: cliente.academiaId,
          academiaNome: cliente.academiaNome,
          clientes: [cliente],
        })
      }
    }
    // Unidade com mais pendente primeiro — é a que mais precisa de atenção.
    return [...porAcademia.values()].sort((a, b) => {
      if (b.clientes.length !== a.clientes.length) return b.clientes.length - a.clientes.length
      return a.academiaNome.localeCompare(b.academiaNome)
    })
  }, [clientes])

  const termo = search.trim().toLowerCase()
  const buscando = termo.length > 0

  const gruposFiltrados = useMemo(() => {
    if (!buscando) return grupos
    return grupos
      .map((grupo) => {
        // Bateu no nome da unidade: mantém o grupo inteiro. Senão, filtra só
        // quem bate por nome/telefone dentro dele — mesmo grupo pode aparecer
        // parcial (só os alunos que batem) quando a busca é por pessoa.
        const grupoInteiro = grupo.academiaNome.toLowerCase().includes(termo)
        const clientesFiltrados = grupoInteiro
          ? grupo.clientes
          : grupo.clientes.filter((c) => matchesNomeOuTelefone(search, c.nome, c.telefone))
        return { ...grupo, clientes: clientesFiltrados }
      })
      .filter((grupo) => grupo.clientes.length > 0)
  }, [grupos, buscando, search, termo])

  const totalFiltrado = gruposFiltrados.reduce((sum, g) => sum + g.clientes.length, 0)

  function toggleGrupo(academiaId: string) {
    setFechadas((prev) => {
      const next = new Set(prev)
      if (next.has(academiaId)) next.delete(academiaId)
      else next.add(academiaId)
      return next
    })
  }

  function handleExport() {
    const header = ['Academia', 'Nome', 'Telefone', 'Email', 'Pendente desde']
    const dataRows = gruposFiltrados.flatMap((grupo) =>
      grupo.clientes.map((c) => [grupo.academiaNome, c.nome, c.telefone ?? '', c.email ?? '', formatDate(c.createdAt)])
    )
    downloadCsv(`alunos-pendentes-por-unidade-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([header, ...dataRows]))
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou unidade…"
          aria-label="Buscar por nome, telefone ou unidade"
          className="input sm:max-w-xs"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFechadas(new Set())}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Expandir tudo
          </button>
          <button
            type="button"
            onClick={() => setFechadas(new Set(grupos.map((g) => g.academiaId)))}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Recolher tudo
          </button>
          <button type="button" onClick={handleExport} className="btn-secondary btn-sm">
            Exportar CSV
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-white">{totalFiltrado}</span>{' '}
        {totalFiltrado === 1 ? 'aluno pendente' : 'alunos pendentes'} em{' '}
        <span className="font-semibold text-slate-900 dark:text-white">{gruposFiltrados.length}</span>{' '}
        {gruposFiltrados.length === 1 ? 'unidade' : 'unidades'}
      </p>

      {gruposFiltrados.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum aluno encontrado pra essa busca.</div>
      ) : (
        <div className="space-y-2">
          {gruposFiltrados.map((grupo) => {
            // Enquanto busca, resultado sempre abre — ignora o que foi fechado
            // manualmente, senão a unidade some da vista mesmo tendo resultado.
            const aberta = buscando || !fechadas.has(grupo.academiaId)

            return (
              <div key={grupo.academiaId} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGrupo(grupo.academiaId)}
                  aria-expanded={aberta}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    {grupo.academiaNome}
                    <span className="badge bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      {grupo.clientes.length}
                    </span>
                  </span>
                  <Icon
                    name="chevron-down"
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${aberta ? 'rotate-180' : ''}`}
                  />
                </button>

                {aberta && (
                  <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                          <th className="px-4 py-2.5">Nome</th>
                          <th className="px-4 py-2.5">Telefone</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">Pendente desde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.clientes.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-slate-50 dark:border-slate-800/60 transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70"
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <Avatar name={c.nome} className="h-7 w-7 text-[11px]" />
                                <span className="text-slate-900 dark:text-white">{c.nome}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{c.telefone ?? '—'}</td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{c.email ?? '—'}</td>
                            <td className="px-4 py-2.5 tabular-nums text-slate-600 dark:text-slate-300">
                              {formatDate(c.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
