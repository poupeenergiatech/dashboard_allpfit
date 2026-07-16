'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ScansDailyPoint } from '@/lib/dashboard/fetch-scans'

// Mesmo violet do card "Scans QR" no funil (funnel-card.tsx accent="violet") — uma
// série só, então nenhuma checagem de contraste entre séries é necessária aqui.
const COLOR = '#7c3aed'

function formatDay(date: string): string {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

export function ScansTrendChart({ series }: { series: ScansDailyPoint[] }) {
  if (series.length < 2) {
    return (
      <div className="card flex h-72 items-center justify-center p-5 text-center text-sm text-slate-500">
        Selecione um período delimitado (não &quot;Todo período&quot;) pra ver a tendência diária.
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500">Scans QR por dia</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              labelFormatter={(label) => formatDay(String(label))}
              contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 13 }}
            />
            <Line
              type="monotone"
              dataKey="totalScans"
              name="Scans"
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
