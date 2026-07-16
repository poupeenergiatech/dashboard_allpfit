'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ScansPorAcademia } from '@/lib/dashboard/fetch-scans'

const COLOR = '#7c3aed'

export function ScansRankingChart({ rows }: { rows: ScansPorAcademia[] }) {
  if (rows.length <= 1) return null

  // Barra horizontal — igual à de contatos/conversões (academia-performance-chart.tsx),
  // melhor pra nomes longos de unidade do que barras verticais espremidas.
  const height = Math.max(240, rows.length * 44)

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500">Scans QR por academia</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={140}
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 13 }} />
            <Bar dataKey="totalScans" name="Scans" fill={COLOR} radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
