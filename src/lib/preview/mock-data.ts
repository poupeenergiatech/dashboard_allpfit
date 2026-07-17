// Dados fictícios usados só pela rota /preview (sem Supabase real). Nunca
// importar isso fora de src/app/preview/.
import type { Academia, DailyFunnelPoint, FunnelCounts } from '@/lib/dashboard/types'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'
import type { ScansDailyPoint, ScansSummary } from '@/lib/dashboard/fetch-scans'
import type {
  PendenciaEntry,
  PendenciaPorAcademia,
  PendenciaTrendPoint,
} from '@/lib/dashboard/fetch-pendencias-assinatura'
import type { NumeroGroup } from '@/lib/dashboard/fetch-numeros'
import type { TreinadaStatus } from '@/lib/dashboard/fetch-treinadas'
import type { ManualDataEntry } from '@/lib/dashboard/fetch-manual-data-history'
import type { UserRow } from '@/components/dashboard/users-table'

export const MOCK_ACADEMIAS: Academia[] = [
  { id: '1', nome: 'Allp Fit - Pinheiros' },
  { id: '2', nome: 'Allp Fit - Moema' },
  { id: '3', nome: 'Allp Fit - Tatuapé' },
  { id: '4', nome: 'Allp Fit - Santo Amaro' },
  { id: '5', nome: 'Allp Fit - Vila Mariana' },
  { id: '6', nome: 'Allp Fit - Ipiranga' },
]

// Distribui um total diário entre as academias mockadas (algumas ficam com 0), só
// pra ilustrar o breakdown expansível do histórico diário — reusado pela série do
// funil e pela de /scans.
function distributeScans(totalScans: number, dayIndex: number): { academiaId: string; academiaNome: string; totalScans: number }[] {
  const weights = MOCK_ACADEMIAS.map((_, j) => Math.max(0, Math.sin((dayIndex + j) / 2) + 0.3))
  const weightSum = weights.reduce((s, w) => s + w, 0) || 1
  let distributed = 0
  return MOCK_ACADEMIAS.map((a, j) => {
    const isLast = j === MOCK_ACADEMIAS.length - 1
    const value = isLast
      ? Math.max(0, totalScans - distributed)
      : Math.round((weights[j] / weightSum) * totalScans)
    distributed += value
    return { academiaId: a.id, academiaNome: a.nome, totalScans: value }
  })
}

const MOCK_FUNNEL_SERIES: DailyFunnelPoint[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date('2026-06-27T00:00:00')
  date.setDate(date.getDate() + i)
  const totalScans = 20 + Math.round(8 * Math.sin(i / 3))
  return {
    date: date.toISOString().slice(0, 10),
    totalAlunos: 300 + i * 4,
    totalScans,
    contatos: 10 + Math.round(6 * Math.sin(i / 2)) + i,
    conversoes: 2 + Math.round(1.5 * Math.sin(i / 2 + 1)) + Math.floor(i / 4),
    reprovados: Math.max(0, Math.round(1 + Math.sin(i / 3))),
    scansPorAcademia: distributeScans(totalScans, i),
  }
})

export const MOCK_FUNNEL_COUNTS: FunnelCounts = {
  totalAlunos: 4820,
  totalScans: 612,
  totalContatos: 214,
  totalConversoes: 47,
  totalReprovados: MOCK_FUNNEL_SERIES.reduce((s, p) => s + p.reprovados, 0),
  series: MOCK_FUNNEL_SERIES,
}

// Série própria de /scans (30 dias, mais longa que a do funil) — mesma distribuição
// fictícia por academia, só que num intervalo maior pra ilustrar a paginação do
// histórico diário e o gráfico de tendência.
const MOCK_SCANS_SERIES: ScansDailyPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-06-17T00:00:00')
  date.setDate(date.getDate() + i)
  const totalScans = 18 + Math.round(9 * Math.sin(i / 4))
  return {
    date: date.toISOString().slice(0, 10),
    totalScans,
    porAcademia: distributeScans(totalScans, i),
  }
})

export const MOCK_SCANS_SUMMARY: ScansSummary = {
  totalScans: MOCK_SCANS_SERIES.reduce((s, p) => s + p.totalScans, 0),
  porAcademia: [...MOCK_ACADEMIAS]
    .map((a, i) => ({ academiaId: a.id, nome: a.nome, totalScans: 140 - i * 22 }))
    .sort((a, b) => b.totalScans - a.totalScans),
  series: MOCK_SCANS_SERIES,
  days: MOCK_SCANS_SERIES.length,
}

export const MOCK_PERFORMANCE: AcademiaPerformance[] = MOCK_ACADEMIAS.map((a, i) => ({
  academiaId: a.id,
  nome: a.nome,
  totalContatos: 60 - i * 6,
  totalConversoes: 14 - i,
}))

// Uma linha com ajuste manual de contatos (ex.: correção de um dia em que o
// webhook do agregador falhou), pra ilustrar o badge no histórico.
export const MOCK_MANUAL_DATA_HISTORY: ManualDataEntry[] = [
  {
    id: 'md1',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
    data: '2026-07-10',
    totalScans: 34,
    contatosAjuste: 12,
    conversoesAjuste: null,
    reprovados: 2,
  },
  {
    id: 'md2',
    academiaId: MOCK_ACADEMIAS[1].id,
    academiaNome: MOCK_ACADEMIAS[1].nome,
    data: '2026-07-09',
    totalScans: 21,
    contatosAjuste: null,
    conversoesAjuste: null,
    reprovados: 0,
  },
]

export const MOCK_PENDENCIAS_POR_ACADEMIA: PendenciaPorAcademia[] = MOCK_ACADEMIAS.map((a, i) => ({
  academiaId: a.id,
  nome: a.nome,
  quantidade: 18 - i * 3,
  data: '2026-07-12',
}))

export const MOCK_PENDENCIAS_TREND: PendenciaTrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-06-13T00:00:00')
  date.setDate(date.getDate() + i)
  return {
    date: date.toISOString().slice(0, 10),
    quantidade: 40 + Math.round(10 * Math.sin(i / 4)) + Math.floor(i / 3),
  }
})

export const MOCK_PENDENCIAS_HISTORY: PendenciaEntry[] = [
  {
    id: 'pa1',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
    data: '2026-07-12',
    quantidade: 18,
  },
  {
    id: 'pa2',
    academiaId: MOCK_ACADEMIAS[1].id,
    academiaNome: MOCK_ACADEMIAS[1].nome,
    data: '2026-07-11',
    quantidade: 15,
  },
]

// Duas unidades (Pinheiros e Moema) compartilhando o mesmo número, pra ilustrar o
// agrupamento — o resto tem número próprio ou nenhum configurado ainda.
export const MOCK_NUMEROS: NumeroGroup[] = [
  {
    numeroTelefone: '5511987650001',
    ativo: true,
    mensagensHoje: 32 + 28,
    unidades: [
      { academiaId: MOCK_ACADEMIAS[0].id, nome: MOCK_ACADEMIAS[0].nome, ativo: true },
      { academiaId: MOCK_ACADEMIAS[1].id, nome: MOCK_ACADEMIAS[1].nome, ativo: false },
    ],
  },
  ...MOCK_ACADEMIAS.slice(2, 5).map((a, i) => ({
    numeroTelefone: `551199${String(1000000 + i).slice(-7)}`,
    ativo: i % 3 !== 2,
    mensagensHoje: 24 - i * 5,
    unidades: [{ academiaId: a.id, nome: a.nome, ativo: i % 3 !== 2 }],
  })),
  {
    numeroTelefone: null,
    ativo: false,
    mensagensHoje: 0,
    unidades: [{ academiaId: MOCK_ACADEMIAS[5].id, nome: MOCK_ACADEMIAS[5].nome, ativo: false }],
  },
]

export const MOCK_TREINADAS: TreinadaStatus[] = MOCK_ACADEMIAS.map((a, i) => ({
  academiaId: a.id,
  nome: a.nome,
  treinada: i % 2 === 0,
}))

export const MOCK_USERS: UserRow[] = [
  { id: 'u1', email: 'superadmin@allpfit.dev', role: 'super_admin', academiaId: null, academiaNome: null },
  { id: 'u2', email: 'gestor@allpfit.dev', role: 'gestor', academiaId: null, academiaNome: null },
  {
    id: 'u3',
    email: 'coordenador.pinheiros@allpfit.dev',
    role: 'coordenador',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
  },
  {
    id: 'u4',
    email: 'visualizador.moema@allpfit.dev',
    role: 'visualizador',
    academiaId: MOCK_ACADEMIAS[1].id,
    academiaNome: MOCK_ACADEMIAS[1].nome,
  },
]
