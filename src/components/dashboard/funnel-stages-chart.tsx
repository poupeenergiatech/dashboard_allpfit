'use client'

import { computeMaxLog, toWeight } from '@/lib/dashboard/log-scale'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { FunnelCounts } from '@/lib/dashboard/types'

// Ordinal (uma cor, degradê) — o que importa aqui é a posição no funil, não a
// identidade de cada etapa. Steps validados com validate_palette.js --ordinal:
// monótono, e o degrau mais claro ainda contrasta com o fundo (>= 2:1). O degradê
// claro->escuro do tema claro perderia contraste num card escuro (#1e3a8a quase
// some no slate-900), por isso o modo escuro usa uma escala mais clara/saturada.
const STAGE_COLORS = ['#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a', '#172554']
const STAGE_COLORS_DARK = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb']

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

function formatRate(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

type Stage = { name: string; value: number; weight: number; rate: number | null }

// Alunos totais fica em ordens de grandeza acima de scans/contatos/conversões (ex.:
// 45.000 vs dezenas) — largura proporcional ao valor bruto faz o funil colapsar num
// "V" logo depois da 1ª etapa, com as demais reduzidas a poucos pixels. toWeight
// (log-scale.ts) resolve isso comprimindo a proporção via log1p.
//
// Cada barra é desenhada com largura própria (proporcional só ao seu valor), não
// como um trapézio conectado à barra vizinha — o Funnel da Recharts interpola a
// forma entre etapas adjacentes, e como os dados reais nem sempre são monótonos
// decrescentes (ex.: Scans/Contatos zerados por falha de captura, mas Conversões >
// 0 por lançamento manual), essa interpolação produzia uma silhueta em "gravata"
// bem feia (pescoço colado a 0 e alargando de novo embaixo). Barras
// independentes não têm esse problema: cada uma só descreve a si mesma.
export function FunnelStagesChart({ counts }: { counts: FunnelCounts }) {
  const isDark = useIsDark()
  const stageColors = isDark ? STAGE_COLORS_DARK : STAGE_COLORS

  const raw = [
    { name: 'Alunos totais', value: counts.totalAlunos },
    { name: 'Scans QR', value: counts.totalScans },
    { name: 'Contatos', value: counts.totalContatos },
    { name: 'Conversões', value: counts.totalConversoes },
    { name: 'Clientes Alle ativos', value: counts.totalClientesAlle },
  ]

  if (raw.every((stage) => stage.value === 0)) {
    return (
      <div className="card flex h-72 items-center justify-center p-5 text-sm text-slate-500 dark:text-slate-400">
        Sem dados no período selecionado.
      </div>
    )
  }

  const maxLog = computeMaxLog(raw.map((s) => s.value))
  const stages: Stage[] = raw.map((s, i) => {
    const prev = raw[i - 1]
    const rate = i === 0 || !prev || !prev.value ? null : (s.value / prev.value) * 100
    return { ...s, weight: toWeight(s.value, maxLog), rate }
  })

  // Conversão de ponta a ponta (alunos -> clientes Alle ativos) — a pergunta que todo
  // relatório de funil (Mixpanel, Amplitude, GA) responde logo no título: de tudo que
  // entrou, quanto virou resultado final.
  const overallRate = raw[0].value ? (raw[raw.length - 1].value / raw[0].value) * 100 : null

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Funil de conversão</p>
        {overallRate != null && (
          <span className="inline-flex items-center rounded-full bg-accent-50 dark:bg-accent-500/10 px-2.5 py-0.5 text-xs font-semibold text-accent-600 dark:text-accent-400">
            Conversão geral: {formatRate(overallRate)}%
          </span>
        )}
      </div>
      <div className="space-y-3.5">
        {stages.map((stage, i) => (
          <div key={stage.name}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{stage.name}</span>
              <span className="whitespace-nowrap text-sm tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(stage.value)}</span>
                {stage.rate != null && (
                  <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
                    · {formatRate(stage.rate)}% da etapa anterior
                  </span>
                )}
              </span>
            </div>
            <div className="h-8 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/60">
              <div
                className="h-full rounded-lg"
                style={{
                  width: `${stage.weight * 100}%`,
                  backgroundColor: stage.value > 0 ? stageColors[i] : 'transparent',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
