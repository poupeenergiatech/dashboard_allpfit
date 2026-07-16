'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'

// Mesmas cores da tendência do funil (emerald/amber) — mesma identidade em todo o
// app pra contatos vs conversões. Validado: pior par ΔE 39.3 (alvo >= 12).
const SERIES = {
  contatos: { key: 'totalContatos' as const, label: 'Contatos', color: '#059669' },
  conversoes: { key: 'totalConversoes' as const, label: 'Conversões', color: '#d97706' },
}

export function AcademiaPerformanceChart({ rows }: { rows: AcademiaPerformance[] }) {
  const chrome = getChartChrome(useIsDark())
  if (rows.length === 0) return null

  // Barra horizontal — melhor pra muitas categorias com nome longo (nome da
  // unidade) do que barras verticais espremidas. Altura cresce com o número de
  // academias pra não amontoar.
  const height = Math.max(240, rows.length * 44)

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Contatos e conversões por academia</p>
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
              dataKey={SERIES.contatos.key}
              name={SERIES.contatos.label}
              fill={SERIES.contatos.color}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            />
            <Bar
              dataKey={SERIES.conversoes.key}
              name={SERIES.conversoes.label}
              fill={SERIES.conversoes.color}
              radius={[0, 4, 4, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
