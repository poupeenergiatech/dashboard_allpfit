'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'

// Mesmo brand-600 usado no resto do produto pra "resultado" — realizado e previsão são
// o mesmo hue (é a mesma métrica, só muda a confiança), diferenciados por traço
// (sólido x tracejado) em vez de duas cores categóricas, então nenhuma checagem de
// contraste entre séries é necessária aqui.
const COLOR = '#7b00ae'

// Dados fixos só pra ilustrar o layout — sem fonte real ainda (ver
// canAccessFinanceiro em src/lib/auth/profile.ts pra quem acessa a página). Ago é o
// mês corrente (ver AGENTS.md/currentDate) e aparece nas duas séries de propósito,
// pra a linha tracejada de previsão continuar visualmente a partir do último ponto
// realizado em vez de deixar uma quebra no gráfico.
const MOCK_SERIES = [
  { mes: 'Jan', realizado: 38, previsao: null },
  { mes: 'Fev', realizado: 42, previsao: null },
  { mes: 'Mar', realizado: 51, previsao: null },
  { mes: 'Abr', realizado: 47, previsao: null },
  { mes: 'Mai', realizado: 58, previsao: null },
  { mes: 'Jun', realizado: 63, previsao: null },
  { mes: 'Jul', realizado: 71, previsao: null },
  { mes: 'Ago', realizado: 76, previsao: 76 },
  { mes: 'Set', realizado: null, previsao: 82 },
  { mes: 'Out', realizado: null, previsao: 89 },
  { mes: 'Nov', realizado: null, previsao: 95 },
  { mes: 'Dez', realizado: null, previsao: 104 },
]

export function FinanceiroConversionsForecastChart() {
  const chrome = getChartChrome(useIsDark())

  return (
    <div className="card p-5">
      <p className="panel-title mb-1">Conversões — realizado x previsão (mock)</p>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Projeção linear a partir da tendência dos últimos meses, até o fim do ano.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_SERIES} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={{ stroke: chrome.axisLine }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={false}
              width={32}
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
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: chrome.legend }} />
            <Line
              type="monotone"
              dataKey="realizado"
              name="Realizado"
              stroke={COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="previsao"
              name="Previsão"
              stroke={COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
