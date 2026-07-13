'use client'

import { useMemo, useState } from 'react'
import type { SyncLogEntry } from '@/lib/dashboard/fetch-sync-history'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

type OrigemFilter = 'todos' | 'manual' | 'automatico'
type StatusFilter = 'todos' | 'sucesso' | 'erro'

const ORIGEM_OPTIONS: { value: OrigemFilter; label: string }[] = [
  { value: 'todos', label: 'Todas as origens' },
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automático' },
]

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
    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
            value === opt.value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function SyncHistoryTable({ entries }: { entries: SyncLogEntry[] }) {
  const [origem, setOrigem] = useState<OrigemFilter>('todos')
  const [status, setStatus] = useState<StatusFilter>('todos')

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (origem !== 'todos' && entry.triggeredBy !== origem) return false
      if (status !== 'todos' && entry.status !== status) return false
      return true
    })
  }, [entries, origem, status])

  if (entries.length === 0) {
    return <div className="card-dashed text-sm text-slate-500">Nenhuma sincronização registrada ainda.</div>
  }

  return (
    <div className="space-y-3">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Pills options={ORIGEM_OPTIONS} value={origem} onChange={setOrigem} />
        <Pills options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </div>

      {filtered.length === 0 ? (
        <div className="card-dashed text-sm text-slate-500">Nenhuma sincronização encontrada pra esse filtro.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Convertidos</th>
                <th className="px-4 py-3 text-right">Novas</th>
                <th className="px-4 py-3 text-right">Já existentes</th>
                <th className="px-4 py-3">Não encontradas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-50 align-top transition last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-600">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        entry.triggeredBy === 'manual' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {entry.triggeredBy === 'manual' ? 'Manual' : 'Automático'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === 'sucesso' ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Sucesso</span>
                    ) : (
                      <span className="badge bg-rose-50 text-rose-700">Erro</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {entry.totalConvertidos ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.inseridas ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.jaExistentes ?? '—'}</td>
                  <td className="px-4 py-3 max-w-[280px] text-xs text-slate-500">
                    {entry.status === 'erro' ? (
                      <span className="text-rose-600">{entry.errorMessage}</span>
                    ) : entry.naoEncontradas.length > 0 ? (
                      <span className="text-amber-700">
                        {entry.naoEncontradas.length}: {entry.naoEncontradas.join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
