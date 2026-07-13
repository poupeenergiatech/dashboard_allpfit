'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PendenciaPorAcademia } from '@/lib/dashboard/fetch-pendencias-assinatura'

// Uma métrica só (quantidade atual), várias academias — cor única, não precisa de
// paleta categórica. Rose distingue de emerald/amber (contatos/conversões) usados
// no resto do app. Validado: pior par ΔE 31.3 (alvo >= 12).
const COLOR = '#e11d48'

export function PendenciasPorAcademiaChart({ rows }: { rows: PendenciaPorAcademia[] }) {
  if (rows.length === 0) return null

  // Barra horizontal — melhor pra muitas categorias com nome longo (nome da
  // unidade) do que barras verticais espremidas.
  const height = Math.max(240, rows.length * 44)

  return (
    <div className="card p-5">
      <p className="mb-3 text-sm font-medium text-slate-500">Alunos pendentes por academia (atual)</p>
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
            <Bar dataKey="quantidade" name="Pendentes" fill={COLOR} radius={[0, 4, 4, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
