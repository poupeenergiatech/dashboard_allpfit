'use client'

import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import { formatCompetencia, type ValorMensalUnidade } from '@/lib/dashboard/financeiro-valor-mensal'

// Uma linha por unidade não escala — a rede já passa de 50 academias, e um gráfico
// com 50 nomes na legenda/tooltip fica ilegível não importa a paleta. Em vez disso: o
// gráfico sempre mostra o Total (soma de todas as unidades no mês), e o usuário
// escolhe no máximo UMA unidade pra comparar lado a lado — nunca mais que 2 linhas,
// então o gráfico continua legível não importa se existem 7 ou 500 academias.
const TOTAL_COLOR = { light: '#2a78d6', dark: '#3987e5' }
const COMPARAR_COLOR = { light: '#eb6834', dark: '#d95926' }

type ChartPoint = {
  key: number
  competencia: string
  total: number
  porAcademia: Record<string, number>
}

function buildPoints(rows: ValorMensalUnidade[]): ChartPoint[] {
  const porCompetencia = new Map<number, ChartPoint>()

  for (const r of rows) {
    const key = r.ano * 100 + r.mes
    const ponto = porCompetencia.get(key) ?? { key, competencia: formatCompetencia(r.ano, r.mes), total: 0, porAcademia: {} }
    ponto.total += r.valorTotalCentavos / 100
    ponto.porAcademia[r.academiaId] = r.valorTotalCentavos / 100
    porCompetencia.set(key, ponto)
  }

  return Array.from(porCompetencia.values()).sort((a, b) => a.key - b.key)
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

// compararId é controlado pelo pai (financeiro-valor-mensal-section.tsx) — o mesmo
// filtro escolhido nos cards reflete aqui e na tabela de histórico, sem select
// próprio duplicado.
export function FinanceiroValorMensalChart({ rows, compararId }: { rows: ValorMensalUnidade[]; compararId: string }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)

  const points = useMemo(() => buildPoints(rows), [rows])

  const academias = useMemo(() => {
    const porId = new Map<string, string>()
    for (const r of rows) porId.set(r.academiaId, r.academiaNome)
    return Array.from(porId.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [rows])

  if (points.length === 0) return null

  const comparar = academias.find((a) => a.id === compararId)
  const chartData = points.map((p) => ({
    competencia: p.competencia,
    total: p.total,
    comparar: comparar ? (p.porAcademia[comparar.id] ?? 0) : undefined,
  }))

  return (
    <div className="card p-5">
      <p className="panel-title mb-3">
        Valor mensal — histórico
        {comparar && <span className="font-normal text-slate-400 dark:text-slate-500"> · comparando com {comparar.nome}</span>}
      </p>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis dataKey="competencia" tick={{ fontSize: 12, fill: chrome.tick }} tickLine={false} axisLine={{ stroke: chrome.axisLine }} />
            <YAxis
              tickFormatter={(value) => formatCurrency(Number(value))}
              tick={{ fontSize: 12, fill: chrome.tick }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              contentStyle={{
                borderRadius: 12,
                borderColor: chrome.tooltipBorder,
                backgroundColor: chrome.tooltipBg,
                color: chrome.tooltipText,
                fontSize: 13,
              }}
            />
            {/* Legenda só entra quando há 2 séries — com 1 série só (Total), o
                título do card já identifica a linha, uma legenda seria redundante. */}
            {comparar && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: chrome.legend, paddingTop: 8 }} itemSorter={null} />
            )}
            <Line
              type="monotone"
              dataKey="total"
              name="Total (todas as unidades)"
              stroke={isDark ? TOTAL_COLOR.dark : TOTAL_COLOR.light}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            {comparar && (
              <Line
                type="monotone"
                dataKey="comparar"
                name={comparar.nome}
                stroke={isDark ? COMPARAR_COLOR.dark : COMPARAR_COLOR.light}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
