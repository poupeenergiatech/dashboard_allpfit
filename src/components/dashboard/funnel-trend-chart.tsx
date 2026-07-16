'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { DailyFunnelPoint } from '@/lib/dashboard/types'

// Categórico, 2 séries — mesmas cores já usadas nos cards do funil (emerald pra
// contatos, amber pra conversões). Validado: pior par ΔE 39.3 (alvo >= 12).
const SERIES = {
  contatos: { key: 'contatos' as const, label: 'Contatos', color: '#059669' },
  conversoes: { key: 'conversoes' as const, label: 'Conversões', color: '#d97706' },
}

function formatDay(date: string): string {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

export function FunnelTrendChart({ series }: { series: DailyFunnelPoint[] }) {
  const chrome = getChartChrome(useIsDark())

  if (series.length < 2) {
    return (
      <div className="card flex h-72 items-center justify-center p-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Selecione o período de 7 ou 30 dias pra ver a tendência diária.
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Contatos e conversões por dia</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={{ stroke: chrome.axisLine }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              labelFormatter={(label) => formatDay(String(label))}
              contentStyle={{
                borderRadius: 12,
                borderColor: chrome.tooltipBorder,
                backgroundColor: chrome.tooltipBg,
                color: chrome.tooltipText,
                fontSize: 13,
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: chrome.legend }} />
            <Line
              type="monotone"
              dataKey={SERIES.contatos.key}
              name={SERIES.contatos.label}
              stroke={SERIES.contatos.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey={SERIES.conversoes.key}
              name={SERIES.conversoes.label}
              stroke={SERIES.conversoes.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
