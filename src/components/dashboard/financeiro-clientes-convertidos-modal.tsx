'use client'

import { useEffect, useState, useTransition } from 'react'
import { listarClientesConvertidosDoMes } from '@/app/(app)/financeiro/actions'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatCompetencia } from '@/lib/dashboard/financeiro-valor-mensal'
import type { ClientesConvertidosDoMes } from '@/lib/dashboard/fetch-clientes-convertidos-mes'

function formatDataConversao(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function formatDataYMD(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// Mesmos rótulos de clientes-convertidos-table.tsx (termoLabel) — mantidos aqui em
// vez de importados porque aquele é um detalhe interno da tabela de /convertidos,
// não algo pra virar dependência cruzada entre as duas telas.
function statusLabel(status: string | null): string {
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
      return 'Sem decisão'
  }
}

// "Verificar os clientes convertidos daquele mês" — aberto a partir de uma linha
// (unidade + competência) de financeiro-detalhamento-unidade-table.tsx. Busca sob
// demanda (só quando abre, não pré-carregado pra cada linha da tabela) via
// listarClientesConvertidosDoMes, que já é Super Admin-only no server.
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
  const [dados, setDados] = useState<ClientesConvertidosDoMes | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (!open || !academiaId) return
    setDados(null)
    startTransition(async () => {
      try {
        setDados(await listarClientesConvertidosDoMes(academiaId, ano, mes))
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao buscar clientes convertidos.', 'error')
        onClose()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, academiaId, ano, mes])

  if (!open) return null

  const totalManualSemNome = dados?.lancamentosManuaisSemNome.reduce((sum, l) => sum + l.quantidade, 0) ?? 0
  const totalGeral = (dados?.clientes.length ?? 0) + totalManualSemNome

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Clientes convertidos — ${academiaNome}`}
      subtitle={formatCompetencia(ano, mes)}
      maxWidthClassName="max-w-2xl"
    >
      {pending || dados === null ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Carregando…</p>
      ) : totalGeral === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum cliente convertido nesse mês.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-900">
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="py-2 pr-3 font-medium">Cliente</th>
                  <th className="py-2 pr-3 font-medium">Origem</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-0 text-right font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dados.clientes.map((c) => (
                  <tr key={`${c.origem}-${c.id}`}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.nome || '?'} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{c.nome || 'Sem nome'}</p>
                          {c.telefone && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{c.telefone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">
                      {c.origem === 'ane' ? 'Ane (automático)' : 'Manual'}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{statusLabel(c.status)}</td>
                    <td className="py-2.5 pr-0 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      {formatDataConversao(c.dataConversao)}
                    </td>
                  </tr>
                ))}
                {dados.lancamentosManuaisSemNome.map((l) => (
                  <tr key={`manual-${l.data}`} className="italic text-slate-400 dark:text-slate-500">
                    <td className="py-2.5 pr-3" colSpan={3}>
                      + {l.quantidade} {l.quantidade === 1 ? 'conversão manual lançada' : 'conversões manuais lançadas'}{' '}
                      (sem cliente identificado — lançamento agregado, ver /performance)
                    </td>
                    <td className="py-2.5 pr-0 text-right tabular-nums">{formatDataYMD(l.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 pt-3 text-right text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            {dados.clientes.length} identificado{dados.clientes.length === 1 ? '' : 's'}
            {totalManualSemNome > 0 && ` + ${totalManualSemNome} sem nome`} = {totalGeral} no total
          </p>
        </div>
      )}
    </Modal>
  )
}
