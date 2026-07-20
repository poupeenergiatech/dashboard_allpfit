import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'

export type ClienteAlle = {
  id: string
  academiaId: string
  academiaNome: string
  nome: string
  telefone: string | null
  email: string | null
  ativo: boolean
  createdAt: string
}

// Clientes ativos na Alle Energia, cadastrados manualmente por academia (ver
// db/migrations/0014_clientes_alle.sql) — sem sincronização automática por enquanto.
// requestedAcademiaId passa por scopeAcademiaId, mesmo padrão de
// fetchAcademiaPerformance: roles escopados (coordenador/visualizador) sempre caem
// na própria academia, mesmo que peçam outra.
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
    ativo: boolean
    created_at: string
  }>(
    `select ca.id, ca.academia_id, a.nome as academia_nome, ca.nome, ca.telefone, ca.email, ca.ativo, ca.created_at
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
    ativo: row.ativo,
    createdAt: row.created_at,
  }))
}
