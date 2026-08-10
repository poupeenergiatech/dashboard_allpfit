'use client'

import { useState } from 'react'
import { AcademiaPerformanceChart } from './academia-performance-chart'
import { GestoresPanelSummaryCards } from './gestores-panel-summary-cards'
import { GestoresPodium } from './gestores-podium'
import { GestoresRankingTable } from './gestores-ranking-table'
import { GestoresScansChart } from './gestores-scans-chart'
import { LiveIndicator } from './live-indicator'
import { useGestoresPanelData } from '@/lib/dashboard/use-gestores-panel-data'
import type { GestoresPanelPeriod } from '@/lib/dashboard/fetch-gestores-panel'
import type { Academia, DateRange } from '@/lib/dashboard/types'

const PERIODS: { value: GestoresPanelPeriod; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: '30 dias' },
  { value: '90dias', label: '90 dias' },
  { value: '1ano', label: '1 ano' },
  { value: 'todos', label: 'Todo período' },
  { value: 'personalizado', label: 'Escolher datas' },
]

const DEFAULT_CUSTOM_RANGE_DAYS = 7

function defaultCustomRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (DEFAULT_CUSTOM_RANGE_DAYS - 1))
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export function GestoresPanelDashboard({
  academias,
  initialAcademiaId = null,
}: {
  academias: Academia[]
  // Unidade vinculada de quem está vendo (coordenador) — filtro parte já
  // selecionado nela a cada carregamento da página, em vez de "Todas as
  // academias" (ver comentário em gestores/page.tsx). null pra quem enxerga
  // todas as academias, que continua vendo o painel sem filtro por padrão.
  initialAcademiaId?: string | null
}) {
  const [period, setPeriod] = useState<GestoresPanelPeriod>('7dias')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [academiaId, setAcademiaId] = useState<string | null>(initialAcademiaId)

  function changePeriod(next: GestoresPanelPeriod) {
    setPeriod(next)
    if (next === 'personalizado' && !customRange) {
      setCustomRange(defaultCustomRange())
    }
  }

  const { data, loading, error, lastUpdatedAt } = useGestoresPanelData(period, customRange, academiaId)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">
            Resumo comparativo entre as unidades — performance, scans, conversões e treinamento, tudo num só lugar
            pra facilitar a competição.
          </p>
        </div>
        <LiveIndicator lastUpdatedAt={lastUpdatedAt} />
      </div>

      <div className="card flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Diferente de /performance ou /scans: aqui filtrar por academia não
              restringe o que dá pra ver (o painel já mostra todas as unidades pra
              quem tem acesso, ver canAccessPainelGestores) — só estreita a visão
              pra quem quer focar numa unidade sem sair da página. */}
          <select
            value={academiaId ?? ''}
            onChange={(e) => setAcademiaId(e.target.value || null)}
            aria-label="Filtrar por academia"
            className="select w-full sm:w-64"
          >
            <option value="">Todas as academias</option>
            {academias.map((academia) => (
              <option key={academia.id} value={academia.id}>
                {academia.nome}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => changePeriod(p.value)}
                aria-pressed={period === p.value}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
                  period === p.value
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'personalizado' && (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              De
              <input
                type="date"
                value={customRange?.from ?? ''}
                max={customRange?.to || undefined}
                onChange={(e) => setCustomRange({ from: e.target.value, to: customRange?.to ?? '' })}
                className="input h-9 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              Até
              <input
                type="date"
                value={customRange?.to ?? ''}
                min={customRange?.from || undefined}
                onChange={(e) => setCustomRange({ from: customRange?.from ?? '', to: e.target.value })}
                className="input h-9 py-1"
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {loading && !data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="skeleton h-80 rounded-2xl" />
            <div className="skeleton h-80 rounded-2xl" />
          </div>
        </>
      ) : (
        data && (
          <>
            <GestoresPanelSummaryCards data={data} />
            {/* 3 pódios lado a lado (empilham no mobile) — cada um já traz o
                ranking das demais academias rolável dentro do próprio card,
                então a tabela completa abaixo (com colunas sem pódio, como
                Alunos/Treinada) continua existindo sem sobreposição de conteúdo. */}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
              <GestoresPodium rows={data.rows} metricKey="totalContatos" />
              <GestoresPodium rows={data.rows} metricKey="totalConversoes" />
              <GestoresPodium rows={data.rows} metricKey="totalScansPeriodo" />
            </div>
            <GestoresRankingTable rows={data.rows} />
            {/* Os dois gráficos por academia lado a lado (empilham no mobile) —
                mesma altura de linha (grid estica por padrão); items-start evita
                que a carta mais curta fique com espaço vazio embaixo só porque a
                vizinha é mais alta (alturas diferem: scans varia com o nº de
                academias, o de performance é fixo). */}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              <GestoresScansChart rows={data.rows} />
              <AcademiaPerformanceChart rows={data.rows} />
            </div>
          </>
        )
      )}
    </div>
  )
}
