'use client'

import { useState } from 'react'
import { FilterBar } from './filter-bar'
import { FunnelDailyHistoryTable } from './funnel-daily-history-table'
import { FunnelGrid } from './funnel-grid'
import { FunnelStagesChart } from './funnel-stages-chart'
import { FunnelTrendChart } from './funnel-trend-chart'
import { LiveIndicator } from './live-indicator'
import { ManualDataSection } from './manual-data-section'
import { Icon } from '@/components/ui/icons'
import { useAcademiaFilter } from '@/lib/dashboard/use-academia-filter'
import { useFunnelData } from '@/lib/dashboard/use-funnel-data'
import type { Academia } from '@/lib/dashboard/types'
import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'

export function FunnelDashboard({
  academias,
  initialAcademiaId,
  canEditManualData,
  isSuperAdmin,
  manualDataHistory,
}: {
  academias: Academia[]
  initialAcademiaId: string | null
  canEditManualData: boolean
  isSuperAdmin: boolean
  manualDataHistory: ManualDataEntry[]
}) {
  const { academiaId, setAcademiaId, period, setPeriod, customRange, setCustomRange } =
    useAcademiaFilter(initialAcademiaId)
  const { counts, loading, error, lastUpdatedAt } = useFunnelData(academiaId, period, customRange)
  const [showManualData, setShowManualData] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Funil de conversão</h2>
          <p className="page-subtitle">Do QR code na academia até a assinatura do contrato.</p>
        </div>
        <LiveIndicator lastUpdatedAt={lastUpdatedAt} />
      </div>

      <FilterBar
        academias={academias}
        academiaId={academiaId}
        onAcademiaChange={setAcademiaId}
        period={period}
        onPeriodChange={setPeriod}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {error && (
        <p className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {loading && !counts ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        </>
      ) : (
        counts && (
          <>
            {/* Gráfico primeiro, números depois: quem só quer bater o olho lê o
                formato do funil (onde está afunilando) antes de entrar nos números
                card a card — os cards continuam logo abaixo pra quem quer o detalhe. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FunnelStagesChart counts={counts} />
              <FunnelTrendChart series={counts.series} />
            </div>
            <FunnelGrid counts={counts} isSuperAdmin={isSuperAdmin} />
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Histórico diário</h3>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Um resumo por dia do período selecionado acima — quantos scans, contatos, conversões e reprovados
                cada dia teve, somando todas as academias no filtro.
              </p>
              {/* key força remontar (e resetar a página) quando o filtro muda — sem
                  isso, o poll de 10s trocaria a prop `series` e a paginação ficaria
                  instável enquanto o usuário navega entre páginas. */}
              <FunnelDailyHistoryTable
                key={`${academiaId ?? 'todas'}-${period}-${customRange?.from ?? ''}-${customRange?.to ?? ''}`}
                series={counts.series}
              />
            </div>
          </>
        )
      )}

      <div>
        {/* Fechado por padrão: é a seção mais densa da página (formulário +
            2 tabelas de histórico) e a maioria de quem só quer ver os números do
            funil nunca precisa abrir — mas fica um clique de distância pra quem
            precisa lançar ou conferir um dado manual. */}
        <button
          type="button"
          onClick={() => setShowManualData((v) => !v)}
          aria-expanded={showManualData}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dados manuais</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lançamentos feitos à mão (scans, ajustes e conversões fora da Ane) — a maioria dos números do funil
              já é automática, não precisa abrir isso pra acompanhar o dia a dia.
            </p>
          </div>
          <Icon
            name="chevron-down"
            strokeWidth={2.5}
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 dark:text-slate-500 ${showManualData ? 'rotate-180' : ''}`}
          />
        </button>
        {showManualData && (
          <div className="mt-3">
            <ManualDataSection
              academias={academias}
              fixedAcademiaId={initialAcademiaId}
              history={manualDataHistory}
              editable={canEditManualData}
            />
          </div>
        )}
      </div>
    </div>
  )
}
