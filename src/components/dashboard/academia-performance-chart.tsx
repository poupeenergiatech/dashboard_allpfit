'use client'

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'

// Alunos (azul, mesma cor da etapa "Alunos totais" no funil) -> Contatos (emerald,
// inalterado, já validado antes) -> Clientes Alle ativos (laranja da marca — mesma
// reserva de "resultado final" usada no card/etapa de conversões, ver
// funnel-card.tsx). Validado com validate_palette.js: light e dark passam full (dark
// usa accent-700 em vez de 600 — 600 caía fora da faixa de luminância do modo
// escuro).
const SERIES = {
  alunos: { key: 'totalAlunos' as const, label: 'Alunos', light: '#3b82f6', dark: '#3b82f6' },
  contatos: { key: 'totalContatos' as const, label: 'Contatos', light: '#059669', dark: '#059669' },
  clientesAlle: { key: 'clientesAlleAtivos' as const, label: 'Clientes Alle ativos', light: '#ef6700', dark: '#da5f00' },
}

function formatNumber(value: number): string {
  return Number(value).toLocaleString('pt-BR')
}

// Todo nome de academia começa com o mesmo prefixo ("Allp Fit - ") — repetir isso em
// cada rótulo do eixo só ocupa espaço sem agregar informação (o prefixo já está no
// breadcrumb/título da página). Corta o prefixo comum entre TODOS os nomes, até o
// último espaço antes dele parar de bater — assim funciona mesmo se o padrão mudar
// (cai pra nome completo se não houver prefixo comum).
function stripCommonPrefix(names: string[]): string[] {
  if (names.length < 2) return names
  let prefixLen = names[0].length
  for (let i = 1; i < names.length; i++) {
    let j = 0
    while (j < prefixLen && j < names[i].length && names[0][j] === names[i][j]) j++
    prefixLen = Math.min(prefixLen, j)
  }
  const prefix = names[0].slice(0, prefixLen)
  const lastSpace = prefix.lastIndexOf(' ')
  const cut = lastSpace > 0 ? lastSpace + 1 : 0
  return names.map((n) => n.slice(cut) || n)
}

// Colunas verticais (era barra horizontal) — versão horizontal rotacionava o nome da
// academia a -40° pra caber, e o texto diagonal colidia com a legenda; cortando o
// prefixo comum ("Allp Fit - ") o nome que sobra ("Santo Amaro", "Vila Mariana"...)
// cabe na horizontal sem rotacionar (nome completo continua no tooltip). Cada série
// mantém sua própria escala (yAxisId próprio, eixo escondido) — Alunos (~300),
// Contatos (~30-60) e Clientes Alle ativos (~2-5) são ordens de grandeza distantes
// entre si; num eixo só, as duas últimas viravam traços quase invisíveis ao lado da
// coluna de Alunos. O valor exato de cada coluna vai no LabelList (mesma ideia do
// FunnelStagesChart): sem eixo visível pra não sugerir uma escala comum que não
// existe, a leitura do número é sempre pelo rótulo, não pela régua.
export function AcademiaPerformanceChart({ rows }: { rows: AcademiaPerformance[] }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)
  if (rows.length === 0) return null

  const labelColor = isDark ? '#f8fafc' : '#0f172a'

  const shortNames = stripCommonPrefix(rows.map((r) => r.nome))
  const chartData = rows.map((r, i) => ({ ...r, shortNome: shortNames[i] }))

  const maxAlunos = Math.max(1, ...rows.map((r) => r.totalAlunos))
  const maxContatos = Math.max(1, ...rows.map((r) => r.totalContatos))
  const maxClientesAlle = Math.max(1, ...rows.map((r) => r.clientesAlleAtivos))

  // Largura mínima por academia (130px) — com muitas unidades, a alternativa seria
  // espremer os grupos até os rótulos colidirem (foi o que quebrou no mobile: "Vila
  // Mariana" e "Ipiranga" se sobrepondo). Em vez disso, igual às tabelas do app
  // (overflow-x-auto + min-width), o gráfico vira rolável horizontalmente — cada
  // grupo sempre com o espaço mínimo pra ficar legível, ao custo de precisar
  // arrastar em telas estreitas com muitas academias.
  const minWidth = Math.max(480, rows.length * 130)

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Alunos, contatos e clientes Alle ativos por academia</p>
      <div className="overflow-x-auto">
        <div style={{ height: 360, minWidth }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 24, right: 12, left: 0, bottom: 4 }} barGap={6} barCategoryGap="20%">
              <XAxis
                dataKey="shortNome"
                tick={{ fontSize: 12, fill: chrome.tooltipText }}
                tickLine={false}
                axisLine={{ stroke: chrome.axisLine }}
                interval={0}
              />
              <YAxis yAxisId="alunos" type="number" domain={[0, maxAlunos]} hide />
              <YAxis yAxisId="contatos" type="number" domain={[0, maxContatos]} hide />
              <YAxis yAxisId="clientesAlle" type="number" domain={[0, maxClientesAlle]} hide />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.nome ?? ''}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: chrome.tooltipBorder,
                  backgroundColor: chrome.tooltipBg,
                  color: chrome.tooltipText,
                  fontSize: 13,
                }}
              />
              <Legend iconType="circle" iconSize={8} verticalAlign="top" wrapperStyle={{ fontSize: 13, color: chrome.legend, paddingBottom: 8 }} />
              <Bar
                yAxisId="alunos"
                dataKey={SERIES.alunos.key}
                name={SERIES.alunos.label}
                fill={isDark ? SERIES.alunos.dark : SERIES.alunos.light}
                radius={[4, 4, 0, 0]}
                barSize={22}
              >
                <LabelList dataKey={SERIES.alunos.key} position="top" fill={labelColor} fontSize={11} formatter={(v) => formatNumber(Number(v))} />
              </Bar>
              <Bar
                yAxisId="contatos"
                dataKey={SERIES.contatos.key}
                name={SERIES.contatos.label}
                fill={isDark ? SERIES.contatos.dark : SERIES.contatos.light}
                radius={[4, 4, 0, 0]}
                barSize={22}
              >
                <LabelList dataKey={SERIES.contatos.key} position="top" fill={labelColor} fontSize={11} formatter={(v) => formatNumber(Number(v))} />
              </Bar>
              <Bar
                yAxisId="clientesAlle"
                dataKey={SERIES.clientesAlle.key}
                name={SERIES.clientesAlle.label}
                fill={isDark ? SERIES.clientesAlle.dark : SERIES.clientesAlle.light}
                radius={[4, 4, 0, 0]}
                barSize={22}
              >
                <LabelList
                  dataKey={SERIES.clientesAlle.key}
                  position="top"
                  fill={labelColor}
                  fontSize={11}
                  formatter={(v) => formatNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
