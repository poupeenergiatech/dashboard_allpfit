'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { PendenciaTrendPoint } from '@/lib/dashboard/fetch-pendencias-assinatura'

const COLOR = '#e11d48'

function formatDay(date: string): string {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

export function PendenciasTrendChart({ series }: { series: PendenciaTrendPoint[] }) {
  const chrome = getChartChrome(useIsDark())
  const hasData = series.some((point) => point.quantidade > 0)
  if (!hasData) {
    return (
      <div className="card flex h-72 items-center justify-center p-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Nenhum lançamento nos últimos 30 dias.
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Total de pendências por dia (últimos 30 dias)</p>
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
            <Line
              type="monotone"
              dataKey="quantidade"
              name="Pendentes"
              stroke={COLOR}
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
