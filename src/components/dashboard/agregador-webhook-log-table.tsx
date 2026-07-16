'use client'

import { Fragment, useMemo, useState } from 'react'
import type { AgregadorWebhookLogEntry } from '@/lib/dashboard/fetch-agregador-webhook-log'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

type StatusFilter = 'todos' | 'sucesso' | 'erro'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'erro', label: 'Erro' },
]

function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
            value === opt.value ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function DistribuicaoRow({ entry }: { entry: AgregadorWebhookLogEntry }) {
  return (
    <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 px-4 py-4">
      {entry.distribuicao.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full min-w-[560px] text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Nome no payload</th>
                <th className="px-3 py-2">Telefone</th>
                <th className="px-3 py-2">Academia casada</th>
                <th className="px-3 py-2">Via</th>
                <th className="px-3 py-2 text-right">Recebidos</th>
                <th className="px-3 py-2 text-right">Inseridos</th>
                <th className="px-3 py-2 text-right">Ignorados</th>
              </tr>
            </thead>
            <tbody>
              {entry.distribuicao.map((d, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{d.academiaLabel ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-slate-500 dark:text-slate-400">{d.telefoneNumero ?? '—'}</td>
                  <td className="px-3 py-2">
                    {d.academiaNome ? (
                      <span className="text-slate-700 dark:text-slate-300">{d.academiaNome}</span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">não encontrada</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {d.matchedBy === 'nome' && <span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">nome</span>}
                    {d.matchedBy === 'telefone' && (
                      <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">telefone</span>
                    )}
                    {!d.matchedBy && <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{d.contatosRecebidos}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{d.contatosInseridos}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-400 dark:text-slate-500">{d.contatosIgnorados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
          Ver payload bruto
        </summary>
        <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100 dark:text-slate-800">
          {entry.payload ? JSON.stringify(entry.payload, null, 2) : '(sem corpo — JSON inválido)'}
        </pre>
      </details>
    </div>
  )
}

export function AgregadorWebhookLogTable({ entries }: { entries: AgregadorWebhookLogEntry[] }) {
  const [status, setStatus] = useState<StatusFilter>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return entries.filter((entry) => status === 'todos' || entry.status === status)
  }, [entries, status])

  if (entries.length === 0) {
    return <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum payload recebido ainda.</div>
  }

  return (
    <div className="space-y-3">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Pills options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </div>

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500 dark:text-slate-400">Nenhum payload encontrado pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Recebido em</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Recebidos</th>
                <th className="px-4 py-3 text-right">Inseridos</th>
                <th className="px-4 py-3 text-right">Ignorados</th>
                <th className="px-4 py-3">Não encontradas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => {
                const isExpanded = expandedId === entry.id
                return (
                  <Fragment key={entry.id}>
                    <tr className="border-b border-slate-50 dark:border-slate-800/60 align-top transition last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-300">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {entry.status === 'sucesso' ? (
                          <span className="badge bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Sucesso</span>
                        ) : (
                          <span className="badge bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400">Erro</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {entry.totalRecebido ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {entry.totalInserido ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                        {entry.totalIgnorado ?? '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] text-xs text-slate-500 dark:text-slate-400">
                        {entry.status === 'erro' && entry.errorMessage ? (
                          <span className="text-rose-600 dark:text-rose-400">{entry.errorMessage}</span>
                        ) : entry.academiasNaoEncontradas.length > 0 ? (
                          <span className="text-amber-700 dark:text-amber-400">
                            {entry.academiasNaoEncontradas.length}: {entry.academiasNaoEncontradas.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          aria-expanded={isExpanded}
                          className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800"
                        >
                          {isExpanded ? 'Fechar' : 'Detalhes'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <DistribuicaoRow entry={entry} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
