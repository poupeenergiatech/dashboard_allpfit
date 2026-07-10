'use client'

import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts'
import type { FunnelCounts } from '@/lib/dashboard/types'

// Ordinal (uma cor, degradê) — o que importa aqui é a posição no funil, não a
// identidade de cada etapa. Steps validados com validate_palette.js --ordinal:
// monótono, e o degrau mais claro ainda contrasta com o fundo (>= 2:1).
const STAGE_COLORS = ['#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a']

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function FunnelStagesChart({ counts }: { counts: FunnelCounts }) {
  const stages = [
    { name: 'Alunos totais', value: counts.totalAlunos },
    { name: 'Scans QR', value: counts.totalScans },
    { name: 'Contatos', value: counts.totalContatos },
    { name: 'Conversões', value: counts.totalConversoes },
  ]

  if (stages.every((stage) => stage.value === 0)) {
    return (
      <div className="card flex h-72 items-center justify-center p-5 text-sm text-slate-500">
        Sem dados no período selecionado.
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="mb-1 text-sm font-medium text-slate-500">Funil de conversão</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Funnel dataKey="value" data={stages} isAnimationActive={false}>
              {stages.map((stage, index) => (
                <Cell key={stage.name} fill={STAGE_COLORS[index]} />
              ))}
              <LabelList
                position="right"
                dataKey="name"
                stroke="none"
                fill="#334155"
                fontSize={13}
                fontWeight={500}
              />
              <LabelList
                position="left"
                dataKey="value"
                stroke="none"
                fill="#0f172a"
                fontSize={13}
                fontWeight={600}
                formatter={(value) => formatNumber(Number(value))}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
