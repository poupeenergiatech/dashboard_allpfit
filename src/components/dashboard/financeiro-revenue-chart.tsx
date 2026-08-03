'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'

// Mesmo emerald usado pra "Clientes Alle ativos" (funnel-card.tsx accent="emerald")
// — série única, então nenhuma checagem de contraste entre séries é necessária aqui.
const COLOR = '#059669'

// Dados fixos só pra ilustrar o layout — sem fonte real ainda (ver
// canAccessFinanceiro em src/lib/auth/profile.ts pra quem acessa a página).
const MOCK_SERIES = [
  { mes: 'Mar', receita: 86400 },
  { mes: 'Abr', receita: 94100 },
  { mes: 'Mai', receita: 101800 },
  { mes: 'Jun', receita: 97300 },
  { mes: 'Jul', receita: 115600 },
  { mes: 'Ago', receita: 128450 },
]

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function FinanceiroRevenueChart() {
  const chrome = getChartChrome(useIsDark())

  return (
    <div className="card p-5">
      <p className="panel-title mb-3">Receita mensal (mock)</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_SERIES} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="financeiroRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={{ stroke: chrome.axisLine }}
            />
            <YAxis
              tickFormatter={(value) => `${(value / 1000).toLocaleString('pt-BR')}k`}
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
              contentStyle={{
                borderRadius: 12,
                borderColor: chrome.tooltipBorder,
                backgroundColor: chrome.tooltipBg,
                color: chrome.tooltipText,
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="receita"
              name="Receita"
              stroke={COLOR}
              strokeWidth={2}
              fill="url(#financeiroRevenueFill)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
