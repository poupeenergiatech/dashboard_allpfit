// Dados fictícios usados só pela rota /preview (sem Supabase real). Nunca
// importar isso fora de src/app/preview/.
import type { Academia, DailyFunnelPoint, FunnelCounts } from '@/lib/dashboard/types'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'
import type { PendingSignature } from '@/lib/dashboard/fetch-pendentes'
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

const MOCK_FUNNEL_SERIES: DailyFunnelPoint[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date('2026-06-27T00:00:00')
  date.setDate(date.getDate() + i)
  return {
    date: date.toISOString().slice(0, 10),
    contatos: 10 + Math.round(6 * Math.sin(i / 2)) + i,
    conversoes: 2 + Math.round(1.5 * Math.sin(i / 2 + 1)) + Math.floor(i / 4),
  }
})

export const MOCK_FUNNEL_COUNTS: FunnelCounts = {
  totalAlunos: 4820,
  totalScans: 612,
  totalContatos: 214,
  totalConversoes: 47,
  series: MOCK_FUNNEL_SERIES,
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
    totalAlunos: 812,
    totalScans: 34,
    contatosAjuste: 12,
    conversoesAjuste: null,
  },
  {
    id: 'md2',
    academiaId: MOCK_ACADEMIAS[1].id,
    academiaNome: MOCK_ACADEMIAS[1].nome,
    data: '2026-07-09',
    totalAlunos: 654,
    totalScans: 21,
    contatosAjuste: null,
    conversoesAjuste: null,
  },
]

export const MOCK_PENDENTES: PendingSignature[] = [
  { id: 'p1', nome: 'Carla Souza', academiaNome: MOCK_ACADEMIAS[0].nome, dataContato: '2026-07-05' },
  { id: 'p2', nome: 'Bruno Alves', academiaNome: MOCK_ACADEMIAS[1].nome, dataContato: '2026-07-06' },
  { id: 'p3', nome: 'Fernanda Lima', academiaNome: MOCK_ACADEMIAS[2].nome, dataContato: '2026-07-07' },
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
  { id: 'u1', email: 'superadmin@allpfit.dev', role: 'super_admin', academiaNome: null },
  { id: 'u2', email: 'gestor@allpfit.dev', role: 'gestor', academiaNome: null },
  { id: 'u3', email: 'coordenador.pinheiros@allpfit.dev', role: 'coordenador', academiaNome: MOCK_ACADEMIAS[0].nome },
  { id: 'u4', email: 'visualizador.moema@allpfit.dev', role: 'visualizador', academiaNome: MOCK_ACADEMIAS[1].nome },
]
