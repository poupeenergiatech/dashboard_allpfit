'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { deleteNotaFiscal, uploadNotaFiscal } from '@/app/(app)/financeiro/actions'
import { Icon } from '@/components/ui/icons'
import { useToast } from '@/components/ui/toast'
import { fetchNotasFiscais, type NotaFiscalEntry, type NotaFiscalTipo } from '@/lib/dashboard/fetch-notas-fiscais'
import type { Academia } from '@/lib/dashboard/types'

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} KB`
}

function NotaFiscalSlot({
  label,
  entry,
  canManage,
  academiaId,
  tipo,
  ano,
  mes,
  onChanged,
}: {
  label: string
  entry: NotaFiscalEntry | undefined
  canManage: boolean
  academiaId: string
  tipo: NotaFiscalTipo
  ano: number
  mes: number
  onChanged: () => void
}) {
  const [pending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.set('academia_id', academiaId)
    formData.set('tipo', tipo)
    formData.set('ano', String(ano))
    formData.set('mes', String(mes))
    formData.set('arquivo', file)

    startTransition(async () => {
      try {
        await uploadNotaFiscal(formData)
        showToast(`Nota fiscal (${label.toLowerCase()}) anexada.`)
        onChanged()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao anexar PDF.', 'error')
      }
    })
  }

  function handleDelete() {
    if (!entry) return
    startTransition(async () => {
      try {
        await deleteNotaFiscal(entry.id)
        showToast(`Nota fiscal (${label.toLowerCase()}) removida.`)
        onChanged()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Erro ao remover PDF.', 'error')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2 text-xs">
      <div className="min-w-0">
        <p className="font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {entry ? (
          <a
            href={entry.arquivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`${entry.nomeArquivo} · ${formatBytes(entry.tamanhoBytes)}${entry.uploadedByEmail ? ` · ${entry.uploadedByEmail}` : ''}`}
            className="block truncate font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            {entry.nomeArquivo}
          </a>
        ) : (
          <p className="text-slate-400 dark:text-slate-500">Sem nota fiscal</p>
        )}
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          {entry ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              title="Remover nota fiscal"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <Icon name="x-circle" className="h-4 w-4" />
            </button>
          ) : (
            <label
              title="Anexar PDF"
              className={`flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 ${pending ? 'opacity-50' : 'cursor-pointer'}`}
            >
              {pending ? '...' : '+ PDF'}
              <input type="file" accept="application/pdf" className="hidden" disabled={pending} onChange={handleUpload} />
            </label>
          )}
        </div>
      )}
    </div>
  )
}

export function NotasFiscaisCalendar({
  academias,
  initialAcademiaId,
  canManage,
}: {
  academias: Academia[]
  initialAcademiaId: string | null
  canManage: boolean
}) {
  const [academiaId, setAcademiaId] = useState<string | null>(initialAcademiaId ?? academias[0]?.id ?? null)
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const [entries, setEntries] = useState<NotaFiscalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!academiaId) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    const next = await fetchNotasFiscais(academiaId, ano)
    setEntries(next)
    setLoading(false)
  }, [academiaId, ano])

  useEffect(() => {
    reload()
  }, [reload])

  const entryFor = (mes: number, tipo: NotaFiscalTipo) =>
    entries.find((e) => e.competenciaMes === mes && e.tipo === tipo)

  return (
    <div className="card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="panel-title">Notas fiscais</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nota da unidade (CNPJ da academia) e nota individual do gestor, mês a mês.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {academias.length > 1 && (
            <select
              value={academiaId ?? ''}
              onChange={(e) => setAcademiaId(e.target.value || null)}
              aria-label="Filtrar notas fiscais por academia"
              className="select h-9 w-56 py-1.5 text-sm"
            >
              {academias.map((academia) => (
                <option key={academia.id} value={academia.id}>
                  {academia.nome}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setAno((a) => a - 1)}
              aria-label="Ano anterior"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              ‹
            </button>
            <span className="min-w-[3.5rem] text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
              {ano}
            </span>
            <button
              type="button"
              onClick={() => setAno((a) => a + 1)}
              aria-label="Próximo ano"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {!academiaId ? (
        <p className="card-dashed mt-3 text-sm text-slate-500 dark:text-slate-400">
          Nenhuma academia disponível.
        </p>
      ) : loading ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-[104px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MESES.map((nomeMes, idx) => {
            const mes = idx + 1
            const unidade = entryFor(mes, 'unidade')
            const individual = entryFor(mes, 'individual')
            const presentes = (unidade ? 1 : 0) + (individual ? 1 : 0)

            return (
              <div key={mes} className="rounded-xl border border-slate-100 dark:border-slate-800 p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{nomeMes}</p>
                  <span
                    className={`badge ${
                      presentes === 2
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : presentes === 1
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span className="badge-dot bg-current" />
                    {presentes}/2
                  </span>
                </div>
                <div className="space-y-1.5">
                  <NotaFiscalSlot
                    label="Unidade"
                    entry={unidade}
                    canManage={canManage}
                    academiaId={academiaId}
                    tipo="unidade"
                    ano={ano}
                    mes={mes}
                    onChanged={reload}
                  />
                  <NotaFiscalSlot
                    label="Individual (gestor)"
                    entry={individual}
                    canManage={canManage}
                    academiaId={academiaId}
                    tipo="individual"
                    ano={ano}
                    mes={mes}
                    onChanged={reload}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
