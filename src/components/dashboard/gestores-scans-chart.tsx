'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { GestoresPanelRow } from '@/lib/dashboard/fetch-gestores-panel'

// Violet = mesma identidade de "scans" usada em /scans (scans-trend-chart.tsx,
// scans-ranking-chart.tsx). Âmbar pro "hoje" é um par categórico validado com
// scripts/validate_palette.js (skill dataviz) nos dois modos — claro usa #f59e0b
// (WARN de contraste aceitável com legenda + rótulos visíveis, que este gráfico já
// tem); escuro precisa do tom mais escuro #d97706 pra entrar na faixa de
// luminosidade do fundo escuro (o claro #f59e0b "estoura" a faixa lá).
const COLOR_PERIODO = '#7c3aed'
const COLOR_HOJE_LIGHT = '#f59e0b'
const COLOR_HOJE_DARK = '#d97706'

// Barras pareadas (total no período x hoje) no mesmo gráfico, por academia — pedido
// explícito: ver de relance quem está performando bem no período E quem está ativo
// hoje, sem precisar cruzar dois gráficos separados.
export function GestoresScansChart({ rows }: { rows: GestoresPanelRow[] }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)
  const colorHoje = isDark ? COLOR_HOJE_DARK : COLOR_HOJE_LIGHT

  if (rows.length === 0) {
    return null
  }

  const data = [...rows]
    .sort((a, b) => b.totalScansPeriodo - a.totalScansPeriodo)
    .map((r) => ({ nome: r.nome, periodo: r.totalScansPeriodo, hoje: r.totalScansHoje }))

  const height = Math.max(260, data.length * 48)

  return (
    <div className="card p-5">
      <p className="panel-title mb-3">Scans QR por academia — total no período e hoje</p>
      {/* Altura da barra continua crescendo com o nº de academias (senão elas
          espremem e ficam ilegíveis), mas o card fica travado em 460px — mesma
          altura do gráfico vizinho (AcademiaPerformanceChart) — com scroll
          vertical por dentro pra não estourar a linha quando há muitas unidades. */}
      <div className="max-h-[460px] overflow-y-auto pr-1">
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barGap={4}>
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
              <Legend
                verticalAlign="top"
                align="right"
                height={32}
                wrapperStyle={{ fontSize: 12, color: chrome.legend }}
              />
              <Bar dataKey="periodo" name="Total no período" fill={COLOR_PERIODO} radius={[0, 4, 4, 0]} maxBarSize={16} />
              <Bar dataKey="hoje" name="Hoje" fill={colorHoje} radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
