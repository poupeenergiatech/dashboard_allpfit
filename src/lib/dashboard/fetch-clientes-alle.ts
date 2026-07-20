import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'

export type ClienteAlleStatus = 'ativo' | 'pendente'

export type ClienteAlle = {
  id: string
  academiaId: string
  academiaNome: string
  nome: string
  telefone: string | null
  email: string | null
  status: ClienteAlleStatus
  createdAt: string
}

// Clientes (ativos ou pendentes de assinar o termo de adesão) da Alle Energia, por
// academia — cadastrados manualmente ou em lote por CSV (ver
// db/migrations/0014_clientes_alle.sql, 0015_clientes_alle_status.sql e
// importClientesAlleCsv em app/(app)/clientes-alle/actions.ts). Sem sincronização
// automática por enquanto. requestedAcademiaId passa por scopeAcademiaId, mesmo
// padrão de fetchAcademiaPerformance: roles escopados (coordenador/visualizador)
// sempre caem na própria academia, mesmo que peçam outra.
export async function fetchClientesAlle(
  profile: UserProfile,
  requestedAcademiaId?: string | null
): Promise<ClienteAlle[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const { rows } = await pool.query<{
    id: string
    academia_id: string
    academia_nome: string
    nome: string
    telefone: string | null
    email: string | null
    status: ClienteAlleStatus
    created_at: string
  }>(
    `select ca.id, ca.academia_id, a.nome as academia_nome, ca.nome, ca.telefone, ca.email, ca.status, ca.created_at
     from clientes_alle ca
     join academias a on a.id = ca.academia_id
     where ($1::uuid is null or ca.academia_id = $1)
     order by ca.nome`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    id: row.id,
    academiaId: row.academia_id,
    academiaNome: row.academia_nome,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  }))
}
