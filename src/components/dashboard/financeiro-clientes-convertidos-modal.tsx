'use client'

import { useEffect, useState, useTransition } from 'react'
import { listarClientesConvertidosDoMes } from '@/app/(app)/financeiro/actions'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatCompetencia } from '@/lib/dashboard/financeiro-valor-mensal'
import type { ClienteConvertidoDoMes } from '@/lib/dashboard/fetch-clientes-convertidos-mes'

function formatDataAtivacao(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// Mesmos rótulos de clientes-convertidos-table.tsx (termoLabel) — mantidos aqui em
// vez de importados porque aquele é um detalhe interno da tabela de /convertidos,
// não algo pra virar dependência cruzada entre as duas telas.
function statusLabel(status: string): string {
  switch (status) {
    case 'ativo':
      return 'Ativo'
    case 'pendente':
      return 'Pendente de assinatura'
    case 'sem_informacao':
      return 'Sem informação'
    case 'com_impedimentos':
      return 'Com impedimentos'
    case 'falta_documentos':
      return 'Falta documentos'
    case 'reprovado':
      return 'Reprovado'
    default:
      return status
  }
}

// "Verificar os clientes convertidos daquele mês" — aberto a partir de uma linha
// (unidade + competência) de financeiro-detalhamento-unidade-table.tsx. Busca sob
// demanda (só quando abre, não pré-carregado pra cada linha da tabela) via
// listarClientesConvertidosDoMes, que já é Super Admin-only no server. Lista quem
// virou 'ativo' PELA PRIMEIRA VEZ naquele mês (mesmo critério do cálculo em
// fetch-financeiro-valor-mensal.ts) — "Status atual" pode já ter mudado desde
// então, a ativação continua contando no mês em que aconteceu.
export function FinanceiroClientesConvertidosModal({
  open,
  onClose,
  academiaId,
  academiaNome,
  ano,
  mes,
}: {
  open: boolean
  onClose: () => void
  academiaId: string | null
  academiaNome: string
  ano: number
  mes: number
}) {
  const [pending, startTransition] = useTransition()
  const [clientes, setClientes] = useState<ClienteConvertidoDoMes[] | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (!open || !academiaId) return
    setClientes(null)
    startTransition(async () => {
      try {
        setClientes(await listarClientesConvertidosDoMes(academiaId, ano, mes))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao buscar clientes convertidos.', 'error')
        onClose()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, academiaId, ano, mes])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Clientes ativados — ${academiaNome}`}
      subtitle={formatCompetencia(ano, mes)}
      maxWidthClassName="max-w-2xl"
    >
      {pending || clientes === null ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Carregando…</p>
      ) : clientes.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum cliente virou ativo nesse mês.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium">Status atual</th>
                  <th className="py-2 pr-0 text-right font-medium">Ativado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.nome} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{c.nome}</p>
                          {c.telefone && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{c.telefone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{statusLabel(c.statusAtual)}</td>
                    <td className="py-2.5 pr-0 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDataAtivacao(c.dataAtivacao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 pt-3 text-right text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            {clientes.length} {clientes.length === 1 ? 'cliente ativado' : 'clientes ativados'} nesse mês
          </p>
        </div>
      )}
    </Modal>
  )
}
