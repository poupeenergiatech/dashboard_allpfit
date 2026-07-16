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

type Stage = { name: string; value: number; weight: number }

// Alunos totais fica em ordens de grandeza acima de scans/contatos/conversões (ex.:
// 45.000 vs dezenas) — largura proporcional ao valor bruto faz o funil colapsar num
// "V" logo depois da 1ª etapa, com as demais reduzidas a poucos pixels (foi o caso
// reportado: só a legenda ficava legível, a forma não). log1p comprime a proporção
// preservando a ordem, então cada etapa não-zero ainda fica com uma faixa legível; o
// piso de 4% é só pra um valor > 0 nunca desaparecer visualmente igual a um 0 de
// verdade.
function toWeight(value: number, maxLog: number): number {
  if (value <= 0 || maxLog <= 0) return 0
  return Math.max(Math.log1p(value) / maxLog, 0.04)
}

function FunnelTooltip({ active, payload }: { active?: boolean; payload?: { payload: Stage }[] }) {
  if (!active || !payload?.length) return null
  const stage = payload[0].payload
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] shadow-sm">
      <p className="font-medium text-slate-900">{stage.name}</p>
      <p className="tabular-nums text-slate-600">{formatNumber(stage.value)}</p>
    </div>
  )
}

export function FunnelStagesChart({ counts }: { counts: FunnelCounts }) {
  const raw = [
    { name: 'Alunos totais', value: counts.totalAlunos },
    { name: 'Scans QR', value: counts.totalScans },
    { name: 'Contatos', value: counts.totalContatos },
    { name: 'Conversões', value: counts.totalConversoes },
  ]

  if (raw.every((stage) => stage.value === 0)) {
    return (
      <div className="card flex h-72 items-center justify-center p-5 text-sm text-slate-500">
        Sem dados no período selecionado.
      </div>
    )
  }

  const maxLog = Math.log1p(Math.max(...raw.map((s) => s.value)))
  const stages: Stage[] = raw.map((s) => ({ ...s, weight: toWeight(s.value, maxLog) }))

  return (
    <div className="card p-5">
      <p className="mb-1 text-sm font-medium text-slate-500">Funil de conversão</p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 4, right: 88, left: 64, bottom: 4 }}>
            <Tooltip content={<FunnelTooltip />} />
            <Funnel dataKey="weight" data={stages} isAnimationActive={false}>
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
