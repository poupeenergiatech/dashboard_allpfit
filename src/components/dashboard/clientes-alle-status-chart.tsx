'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getChartChrome } from '@/lib/dashboard/chart-theme'
import { useIsDark } from '@/lib/dashboard/use-is-dark'
import type { ClienteAlle, ClienteAlleStatus } from '@/lib/dashboard/fetch-clientes-alle'

// Ordem "de saúde decrescente" (ativo -> pendente -> as duas fricções -> soma das
// fricções -> neutro -> reprovado) — mesma leitura de cima a baixo que os filtros
// da tabela. As cores das linhas de status são as mesmas dos badges em toda a tela
// (clientes-alle-table.tsx, clientes-convertidos-table.tsx), exceto sem_informacao:
// o slate-400/700 do badge tem chroma baixo demais pra virar preenchimento de barra
// (validate_palette.js FAIL de chroma floor) — um azul-acinzentado no lugar mantém
// a leitura "neutro/sem dado" sem falhar o mínimo de saturação.
//
// "Reprovados Alle" (com_impedimentos + falta_documentos somados) é a única linha
// que não é um status real — é o valor calculado a partir das duas linhas
// anteriores, inserido logo depois delas (pedido do usuário: virar barra própria
// no gráfico, em vez do texto que ficava no cabeçalho). Fica com cor própria
// (violeta, roxo-700) pra não competir com fricções/reprovado.
//
// Paleta validada com validate_palette.js --mode light/dark (7 linhas, ordem fixa
// importa — revalidar as 7 cores juntas se reordenar ou trocar qualquer uma).
const STATUS_META: { status: ClienteAlleStatus; label: string; light: string; dark: string }[] = [
  { status: 'ativo', label: 'Ativo', light: '#10b981', dark: '#059669' },
  { status: 'pendente', label: 'Pendente', light: '#f59e0b', dark: '#d97706' },
  { status: 'com_impedimentos', label: 'Com impedimentos', light: '#c2410c', dark: '#a3400d' },
  { status: 'falta_documentos', label: 'Falta documentos', light: '#d946ef', dark: '#d946ef' },
  { status: 'sem_informacao', label: 'Sem informação', light: '#5b8bc4', dark: '#5b8bc4' },
  { status: 'reprovado', label: 'Reprovado', light: '#f43f5e', dark: '#e11d48' },
]

const REPROVADOS_ALLE_COLOR = { light: '#6d28d9', dark: '#6d28d9' }

export function ClientesAlleStatusChart({ clientes }: { clientes: ClienteAlle[] }) {
  const isDark = useIsDark()
  const chrome = getChartChrome(isDark)

  const data = useMemo(() => {
    const counts = new Map<ClienteAlleStatus, number>()
    for (const c of clientes) counts.set(c.status, (counts.get(c.status) ?? 0) + 1)

    // Valor embutido no rótulo do eixo (não um LabelList por cima da barra) — com
    // 0 clientes a barra tem largura zero e o LabelList simplesmente não desenha
    // nada ali, o que lê como "esqueceram de mostrar esse status" em vez de "zero
    // gente nesse status". Embutir garante que o 0 apareça sempre.
    function row(label: string, value: number, color: string) {
      return { label: `${label} — ${value}`, value, color }
    }

    const rows = STATUS_META.map((meta) => row(meta.label, counts.get(meta.status) ?? 0, isDark ? meta.dark : meta.light))

    const reprovadosAlle = (counts.get('com_impedimentos') ?? 0) + (counts.get('falta_documentos') ?? 0)
    const reprovadosAlleRow = row(
      'Reprovados Alle',
      reprovadosAlle,
      isDark ? REPROVADOS_ALLE_COLOR.dark : REPROVADOS_ALLE_COLOR.light
    )

    // Insere logo depois de "Falta documentos" (índice 3 em STATUS_META), pra ficar
    // ao lado das duas linhas que soma.
    rows.splice(4, 0, reprovadosAlleRow)
    return rows
  }, [clientes, isDark])

  if (clientes.length === 0) return null

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400">Clientes Alle por status</p>
      {/* 300px pra 7 linhas agora (era 260 pra 6) — mantém a mesma altura por
          linha (~43px) de antes da linha "Reprovados Alle" entrar. */}
      <div style={{ height: 300 }}>
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
