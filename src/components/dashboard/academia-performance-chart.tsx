'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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

export function AcademiaPerformanceChart({ rows }: { rows: AcademiaPerformance[] }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)
  if (rows.length === 0) return null

  // Barra horizontal — melhor pra muitas categorias com nome longo (nome da
  // unidade) do que barras verticais espremidas. Altura cresce com o número de
  // academias pra não amontoar.
  const height = Math.max(240, rows.length * 44)

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Alunos, contatos e clientes Alle ativos por academia</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={chrome.grid} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={{ stroke: chrome.axisLine }}
            />
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
              dataKey={SERIES.alunos.key}
              name={SERIES.alunos.label}
              fill={isDark ? SERIES.alunos.dark : SERIES.alunos.light}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            />
            <Bar
              dataKey={SERIES.contatos.key}
              name={SERIES.contatos.label}
              fill={isDark ? SERIES.contatos.dark : SERIES.contatos.light}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            />
            <Bar
              dataKey={SERIES.clientesAlle.key}
              name={SERIES.clientesAlle.label}
              fill={isDark ? SERIES.clientesAlle.dark : SERIES.clientesAlle.light}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
