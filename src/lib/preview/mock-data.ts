// Dados fictícios usados só pela rota /preview (sem Supabase real). Nunca
// importar isso fora de src/app/preview/.
import type { Academia, FunnelCounts } from '@/lib/dashboard/types'
import type { AcademiaPerformance } from '@/lib/dashboard/fetch-academia-performance'
import type { PendingSignature } from '@/lib/dashboard/fetch-pendentes'
import type { NumeroStatus } from '@/lib/dashboard/fetch-numeros'
import type { TreinadaStatus } from '@/lib/dashboard/fetch-treinadas'
import type { UserRow } from '@/components/dashboard/users-table'

export const MOCK_ACADEMIAS: Academia[] = [
  { id: '1', nome: 'Allp Fit - Pinheiros' },
  { id: '2', nome: 'Allp Fit - Moema' },
  { id: '3', nome: 'Allp Fit - Tatuapé' },
  { id: '4', nome: 'Allp Fit - Santo Amaro' },
  { id: '5', nome: 'Allp Fit - Vila Mariana' },
  { id: '6', nome: 'Allp Fit - Ipiranga' },
]

export const MOCK_FUNNEL_COUNTS: FunnelCounts = {
  totalAlunos: 4820,
  totalScans: 612,
  totalContatos: 214,
  totalConversoes: 47,
}

export const MOCK_PERFORMANCE: AcademiaPerformance[] = MOCK_ACADEMIAS.map((a, i) => ({
  academiaId: a.id,
  nome: a.nome,
  totalContatos: 60 - i * 6,
  totalConversoes: 14 - i,
}))

export const MOCK_PENDENTES: PendingSignature[] = [
  { id: 'p1', nome: 'Carla Souza', academiaNome: MOCK_ACADEMIAS[0].nome, dataContato: '2026-07-05' },
  { id: 'p2', nome: 'Bruno Alves', academiaNome: MOCK_ACADEMIAS[1].nome, dataContato: '2026-07-06' },
  { id: 'p3', nome: 'Fernanda Lima', academiaNome: MOCK_ACADEMIAS[2].nome, dataContato: '2026-07-07' },
]

export const MOCK_NUMEROS: NumeroStatus[] = MOCK_ACADEMIAS.map((a, i) => ({
  academiaId: a.id,
  nome: a.nome,
  numeroTelefone: `551199${String(1000000 + i).slice(-7)}`,
  ativo: i % 4 !== 3,
  mensagensHoje: 32 - i * 4,
}))

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
