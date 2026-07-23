'use client'

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'

// Alunos (azul, mesma cor da etapa "Alunos totais" no funil) -> Contatos (emerald,
// inalterado, já validado antes) -> Clientes Alle ativos (laranja da marca — mesma
// reserva de "resultado final" usada no card/etapa de conversões, ver
// funnel-card.tsx). Removeu "Conversões" daqui: o pedido era especificamente essas
// 3 métricas, e Conversões (Ane+manual) já tem o próprio detalhamento em
// /convertidos. Validado com validate_palette.js: light e dark passam full (dark
// usa accent-700 em vez de 600 — 600 caía fora da faixa de luminância do modo
// escuro).
const SERIES = {
  alunos: { key: 'totalAlunos' as const, label: 'Alunos', light: '#3b82f6', dark: '#3b82f6' },
  contatos: { key: 'totalContatos' as const, label: 'Contatos', light: '#059669', dark: '#059669' },
  clientesAlle: { key: 'clientesAlleAtivos' as const, label: 'Clientes Alle ativos', light: '#ef6700', dark: '#da5f00' },
}

function formatNumber(value: number): string {
  return Number(value).toLocaleString('pt-BR')
}

// Cada série tem sua própria escala (xAxisId próprio, eixo escondido) — Alunos (~300),
// Contatos (~30-60) e Clientes Alle ativos (~2-5) são ordens de grandeza distantes
// entre si; num eixo só, as duas últimas viravam traços quase invisíveis ao lado da
// barra de Alunos. Com 3 domínios independentes (cada um de 0 até o próprio máximo),
// a barra mais alta de cada série sempre usa a largura toda disponível — todas as 3
// ficam legíveis ao mesmo tempo. O valor exato de cada barra vai no LabelList (mesma
// ideia do FunnelStagesChart): sem eixo visível pra não sugerir uma escala comum que
// não existe, a leitura do número é sempre pelo rótulo, não pela régua.
export function AcademiaPerformanceChart({ rows }: { rows: AcademiaPerformance[] }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)
  if (rows.length === 0) return null

  // Barra horizontal — melhor pra muitas categorias com nome longo (nome da
  // unidade) do que barras verticais espremidas. Altura cresce com o número de
  // academias pra não amontoar.
  const height = Math.max(240, rows.length * 44)
  const labelColor = isDark ? '#f8fafc' : '#0f172a'

  const maxAlunos = Math.max(1, ...rows.map((r) => r.totalAlunos))
  const maxContatos = Math.max(1, ...rows.map((r) => r.totalContatos))
  const maxClientesAlle = Math.max(1, ...rows.map((r) => r.clientesAlleAtivos))

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Alunos, contatos e clientes Alle ativos por academia</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }} barGap={2}>
            <XAxis xAxisId="alunos" type="number" domain={[0, maxAlunos]} hide />
            <XAxis xAxisId="contatos" type="number" domain={[0, maxContatos]} hide />
            <XAxis xAxisId="clientesAlle" type="number" domain={[0, maxClientesAlle]} hide />
            <YAxis
              type="category"
              dataKey="nome"
              width={140}
              tick={{ fontSize: 12, fill: chrome.tooltipText }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: chrome.tooltipBorder,
                backgroundColor: chrome.tooltipBg,
                color: chrome.tooltipText,
                fontSize: 13,
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: chrome.legend }} />
            <Bar
              xAxisId="alunos"
              dataKey={SERIES.alunos.key}
              name={SERIES.alunos.label}
              fill={isDark ? SERIES.alunos.dark : SERIES.alunos.light}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            >
              <LabelList dataKey={SERIES.alunos.key} position="right" fill={labelColor} fontSize={11} formatter={(v) => formatNumber(Number(v))} />
            </Bar>
            <Bar
              xAxisId="contatos"
              dataKey={SERIES.contatos.key}
              name={SERIES.contatos.label}
              fill={isDark ? SERIES.contatos.dark : SERIES.contatos.light}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            >
              <LabelList dataKey={SERIES.contatos.key} position="right" fill={labelColor} fontSize={11} formatter={(v) => formatNumber(Number(v))} />
            </Bar>
            <Bar
              xAxisId="clientesAlle"
              dataKey={SERIES.clientesAlle.key}
              name={SERIES.clientesAlle.label}
              fill={isDark ? SERIES.clientesAlle.dark : SERIES.clientesAlle.light}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            >
              <LabelList
                dataKey={SERIES.clientesAlle.key}
                position="right"
                fill={labelColor}
                fontSize={11}
                formatter={(v) => formatNumber(Number(v))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
