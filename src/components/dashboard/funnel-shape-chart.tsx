'use client'

import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts'
import type { LabelProps } from 'recharts'
import { computeMaxLog, toWeight } from '@/lib/dashboard/log-scale'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { FunnelCounts } from '@/lib/dashboard/types'

// Mesma paleta ordinal do FunnelStagesChart (barras) — ver o comentário lá pro porquê
// do degradê e da versão escura ser mais clara.
const STAGE_COLORS = ['#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a', '#172554']
const STAGE_COLORS_DARK = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb']

// Cor do texto da taxa (dentro de cada bloco). No modo claro todos os tons já são
// azuis saturados o bastante pra texto branco funcionar; no escuro, os 2 primeiros
// tons (STAGE_COLORS_DARK) são pastéis quase brancos e precisam de texto escuro —
// os 3 seguintes já são saturados o bastante pra texto branco.
const RATE_TEXT_COLOR = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']
const RATE_TEXT_COLOR_DARK = ['#1e3a8a', '#1e3a8a', '#ffffff', '#ffffff', '#ffffff']

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

function formatRate(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

type Stage = {
  name: string
  value: number
  weight: number
  rate: number | null
  valueLabel: string
  rateLabel: string
}

function FunnelTooltip({ active, payload }: { active?: boolean; payload?: { payload: Stage }[] }) {
  if (!active || !payload?.length) return null
  const stage = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] shadow-sm">
      <p className="font-medium text-slate-900 dark:text-white">{stage.name}</p>
      <p className="tabular-nums text-slate-600 dark:text-slate-300">{formatNumber(stage.value)}</p>
      {stage.rate != null && (
        <p className="tabular-nums text-slate-400 dark:text-slate-500">{formatRate(stage.rate)}% da etapa anterior</p>
      )}
    </div>
  )
}

// Variante "clássica" (silhueta de funil, trapézios conectados) do FunnelStagesChart
// ao lado — mostrada como um segundo card, complementar às barras independentes, pra
// quem quer bater o olho na forma geral de afunilamento.
export function FunnelShapeChart({ counts }: { counts: FunnelCounts }) {
  const isDark = useIsDark()
  const stageColors = isDark ? STAGE_COLORS_DARK : STAGE_COLORS
  const labelColor = isDark ? '#cbd5e1' : '#334155'
  const valueColor = isDark ? '#f8fafc' : '#0f172a'

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

  // Diferente do FunnelStagesChart (barras independentes), essa silhueta conecta uma
  // etapa à seguinte com um trapézio — então ela só faz sentido visual se a largura
  // nunca AUMENTAR de uma etapa pra próxima. Dados reais nem sempre são monótonos
  // (ex.: Scans/Contatos zerados por falha de captura, mas Conversões > 0 por
  // lançamento manual): sem esse limite, o trapézio "alarga de novo" depois de
  // encolher e produz a silhueta em gravata que gerou a reclamação original. runningMin
  // trava a largura no menor valor já visto, preservando a forma de funil (só afunila
  // ou mantém) — os números exibidos continuam sendo os reais, só a silhueta é presa.
  let runningMin = Infinity
  const stages: Stage[] = raw.map((s, i) => {
    const prev = raw[i - 1]
    const rate = i === 0 || !prev || !prev.value ? null : (s.value / prev.value) * 100
    runningMin = Math.min(runningMin, toWeight(s.value, maxLog))
    return {
      ...s,
      weight: runningMin,
      rate,
      valueLabel: formatNumber(s.value),
      rateLabel: rate == null ? '' : `${formatRate(rate)}%`,
    }
  })

  const overallRate = raw[0].value ? (raw[raw.length - 1].value / raw[0].value) * 100 : null

  const rateTextColors = isDark ? RATE_TEXT_COLOR_DARK : RATE_TEXT_COLOR

  // Renderiza a taxa centralizada dentro do próprio bloco do funil (em vez de do lado
  // da quantidade, fora da forma) — com opacidade reduzida pra ficar claramente
  // secundária em relação ao número absoluto (fora) e ao nome da etapa.
  function RateLabel({ viewBox, value, index }: LabelProps) {
    if (!viewBox || !value || index == null || !('width' in viewBox)) return null
    const cx = viewBox.x! + viewBox.width! / 2
    const cy = viewBox.y! + viewBox.height! / 2
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={rateTextColors[index]}
        fillOpacity={0.55}
        fontSize={12}
        fontWeight={600}
      >
        {value}
      </text>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Funil de conversão</p>
        {overallRate != null && (
          <span className="inline-flex items-center rounded-full bg-accent-50 dark:bg-accent-500/10 px-2.5 py-0.5 text-xs font-semibold text-accent-600 dark:text-accent-400">
            Conversão geral: {formatRate(overallRate)}%
          </span>
        )}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 4, right: 88, left: 96, bottom: 4 }}>
            <Tooltip content={<FunnelTooltip />} />
            {/* lastShapeType="triangle" (padrão da Recharts): afunila a última etapa até
                uma ponta, reforçando a silhueta de funil — coerente com o runningMin
                acima, que já garante que a largura só encolhe, nunca alarga. */}
            <Funnel dataKey="weight" data={stages} isAnimationActive={false} lastShapeType="triangle">
              {stages.map((stage, index) => (
                <Cell key={stage.name} fill={stageColors[index]} />
              ))}
              <LabelList
                position="right"
                dataKey="name"
                stroke="none"
                fill={labelColor}
                fontSize={13}
                fontWeight={500}
              />
              <LabelList
                position="left"
                dataKey="valueLabel"
                stroke="none"
                fill={valueColor}
                fontSize={13}
                fontWeight={600}
              />
              <LabelList dataKey="rateLabel" content={RateLabel} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
