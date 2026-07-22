'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { ClienteAlle, ClienteAlleStatus } from '@/lib/dashboard/fetch-clientes-alle'

// Ordem "de saúde decrescente" (ativo -> pendente -> as duas fricções -> neutro ->
// reprovado) — mesma leitura de cima a baixo que os filtros da tabela. As cores são
// as mesmas dos badges de status em toda a tela (clientes-alle-table.tsx,
// clientes-convertidos-table.tsx), exceto sem_informacao: o slate-400/700 do badge
// tem chroma baixo demais pra virar preenchimento de barra (validate_palette.js
// FAIL de chroma floor) — um azul-acinzentado no lugar mantém a leitura "neutro/sem
// dado" sem falhar o mínimo de saturação. Paleta validada com
// validate_palette.js --mode light/dark (6 categorias, ordem fixa importa: mudar a
// posição de com_impedimentos pra perto de reprovado faz o ΔE cair abaixo do piso —
// revalidar se reordenar).
const STATUS_META: { status: ClienteAlleStatus; label: string; light: string; dark: string }[] = [
  { status: 'ativo', label: 'Ativo', light: '#10b981', dark: '#059669' },
  { status: 'pendente', label: 'Pendente', light: '#f59e0b', dark: '#d97706' },
  { status: 'com_impedimentos', label: 'Com impedimentos', light: '#c2410c', dark: '#a3400d' },
  { status: 'falta_documentos', label: 'Falta documentos', light: '#d946ef', dark: '#d946ef' },
  { status: 'sem_informacao', label: 'Sem informação', light: '#5b8bc4', dark: '#5b8bc4' },
  { status: 'reprovado', label: 'Reprovado', light: '#f43f5e', dark: '#e11d48' },
]

export function ClientesAlleStatusChart({ clientes }: { clientes: ClienteAlle[] }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)

  const data = useMemo(() => {
    const counts = new Map<ClienteAlleStatus, number>()
    for (const c of clientes) counts.set(c.status, (counts.get(c.status) ?? 0) + 1)
    return STATUS_META.map((meta) => {
      const value = counts.get(meta.status) ?? 0
      // Valor embutido no rótulo do eixo (não um LabelList por cima da barra) — com
      // 0 clientes a barra tem largura zero e o LabelList simplesmente não desenha
      // nada ali, o que lê como "esqueceram de mostrar esse status" em vez de "zero
      // gente nesse status". Embutir garante que o 0 apareça sempre.
      return { label: `${meta.label} — ${value}`, value, color: isDark ? meta.dark : meta.light }
    })
  }, [clientes, isDark])

  if (clientes.length === 0) return null

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Clientes Alle por status</p>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
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
              dataKey="label"
              width={170}
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
              labelFormatter={(label) => String(label).split(' — ')[0]}
              formatter={(value) => [Number(value), 'Clientes']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
