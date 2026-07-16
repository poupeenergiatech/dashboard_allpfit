// Cores de "chrome" dos gráficos (grid, eixo, tooltip, legenda) — compartilhadas
// pelos gráficos Recharts do dashboard pra não repetir os mesmos hex claro/escuro
// em cada arquivo. Cores de série (linhas, barras, funil) continuam em cada
// componente: essas sim carregam significado (ex.: emerald = contatos) e foram
// validadas por ΔE, então não fazem parte deste tema neutro.
export type ChartChrome = {
  grid: string
  tick: string
  axisLine: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  legend: string
}

const LIGHT: ChartChrome = {
  grid: '#f1f5f9',
  tick: '#94a3b8',
  axisLine: '#e2e8f0',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  tooltipText: '#0f172a',
  legend: '#475569',
}

const DARK: ChartChrome = {
  grid: '#1e293b',
  tick: '#64748b',
  axisLine: '#334155',
  tooltipBg: '#0f172a',
  tooltipBorder: '#334155',
  tooltipText: '#f1f5f9',
  legend: '#94a3b8',
}

export function getChartChrome(isDark: boolean): ChartChrome {
  return isDark ? DARK : LIGHT
}
