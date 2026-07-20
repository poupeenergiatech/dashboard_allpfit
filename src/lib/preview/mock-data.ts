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
import type { ClienteAlle } from '@/lib/dashboard/fetch-clientes-alle'
import type { ClienteConvertido } from '@/lib/dashboard/fetch-clientes-convertidos'
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
  const conversoesAne = 2 + Math.round(1.5 * Math.sin(i / 2 + 1)) + Math.floor(i / 4)
  const conversoesManual = Math.max(0, Math.round(0.5 * Math.sin(i / 4 + 2)))
  return {
    date: date.toISOString().slice(0, 10),
    totalAlunos: 300 + i * 4,
    totalScans,
    contatos: 10 + Math.round(6 * Math.sin(i / 2)) + i,
    conversoesAne,
    conversoesManual,
    conversoes: conversoesAne + conversoesManual,
    reprovados: Math.max(0, Math.round(1 + Math.sin(i / 3))),
    scansPorAcademia: distributeScans(totalScans, i),
  }
})

export const MOCK_FUNNEL_COUNTS: FunnelCounts = {
  totalAlunos: 4820,
  totalScans: 612,
  totalContatos: 214,
  totalConversoesAne: MOCK_FUNNEL_SERIES.reduce((s, p) => s + p.conversoesAne, 0),
  totalConversoesManual: MOCK_FUNNEL_SERIES.reduce((s, p) => s + p.conversoesManual, 0),
  totalConversoes: MOCK_FUNNEL_SERIES.reduce((s, p) => s + p.conversoes, 0),
  totalReprovados: MOCK_FUNNEL_SERIES.reduce((s, p) => s + p.reprovados, 0),
  totalClientesAlle: 32,
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

// A primeira unidade tem conversões manuais/Bitrix (histórico + lançamento do
// dia) cadastradas, só pra ilustrar a coluna "Convertidos Manual".
export const MOCK_PERFORMANCE: AcademiaPerformance[] = MOCK_ACADEMIAS.map((a, i) => {
  const totalConversoesAne = 14 - i
  const conversoesManualAjusteTotal = i === 0 ? 3 : 0
  const totalConversoesManual = (i === 0 ? 2 : 0) + conversoesManualAjusteTotal
  return {
    academiaId: a.id,
    nome: a.nome,
    totalContatos: 60 - i * 6,
    totalConversoesAne,
    totalConversoesManual,
    totalConversoes: totalConversoesAne + totalConversoesManual,
    conversoesManualAjusteTotal,
  }
})

// Uma linha com ajuste manual de contatos (ex.: correção de um dia em que o
// webhook do agregador falhou) e conversões manuais/Bitrix lançadas no dia.
export const MOCK_MANUAL_DATA_HISTORY: ManualDataEntry[] = [
  {
    id: 'md1',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
    data: '2026-07-10',
    totalScans: 34,
    contatosAjuste: 12,
    conversoesManual: 2,
    reprovados: 2,
  },
  {
    id: 'md2',
    academiaId: MOCK_ACADEMIAS[1].id,
    academiaNome: MOCK_ACADEMIAS[1].nome,
    data: '2026-07-09',
    totalScans: 21,
    contatosAjuste: null,
    conversoesManual: 0,
    reprovados: 0,
  },
]

export const MOCK_CLIENTES_ALLE: ClienteAlle[] = [
  {
    id: 'ca1',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
    nome: 'Marina Souza',
    telefone: '5511987654321',
    email: 'marina.souza@exemplo.com',
    status: 'ativo',
    createdAt: '2026-06-20T10:00:00.000Z',
  },
  {
    id: 'ca2',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
    nome: 'Carlos Andrade',
    telefone: '5511976543210',
    email: null,
    status: 'ativo',
    createdAt: '2026-06-22T14:30:00.000Z',
  },
  {
    id: 'ca3',
    academiaId: MOCK_ACADEMIAS[1].id,
    academiaNome: MOCK_ACADEMIAS[1].nome,
    nome: 'Fernanda Lima',
    telefone: null,
    email: 'fernanda.lima@exemplo.com',
    status: 'pendente',
    createdAt: '2026-05-15T09:00:00.000Z',
  },
]

// A última tem academiaId/academiaNome null — convertida pela Ane com
// unidade_allpfit em branco no Alle Documentos, ilustra o badge "Sem unidade".
export const MOCK_CLIENTES_CONVERTIDOS: ClienteConvertido[] = [
  {
    id: 'cv1',
    academiaId: MOCK_ACADEMIAS[0].id,
    academiaNome: MOCK_ACADEMIAS[0].nome,
    nome: 'Juliana Ferreira',
    telefone: '5511991234567',
    createdAt: '2026-07-18T13:00:00.000Z',
  },
  {
    id: 'cv2',
    academiaId: MOCK_ACADEMIAS[2].id,
    academiaNome: MOCK_ACADEMIAS[2].nome,
    nome: 'Roberto Alves',
    telefone: '5511998887766',
    createdAt: '2026-07-17T10:30:00.000Z',
  },
  {
    id: 'cv3',
    academiaId: null,
    academiaNome: null,
    nome: 'Patrícia Gomes',
    telefone: '5511977776655',
    createdAt: '2026-07-16T09:15:00.000Z',
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
