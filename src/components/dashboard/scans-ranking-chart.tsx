'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { ScansPorAcademia } from '@/lib/dashboard/fetch-scans'

const COLOR = '#7c3aed'

export function ScansRankingChart({ rows }: { rows: ScansPorAcademia[] }) {
  const chrome = getChartChrome(useIsDark())
  if (rows.length <= 1) return null

  // Barra horizontal — igual à de contatos/conversões (academia-performance-chart.tsx),
  // melhor pra nomes longos de unidade do que barras verticais espremidas.
  const height = Math.max(240, rows.length * 44)

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Scans QR por academia</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
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
            <Bar dataKey="totalScans" name="Scans" fill={COLOR} radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
