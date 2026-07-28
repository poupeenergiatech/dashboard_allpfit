import { pool } from '@/lib/db/pool'

export type SyncedConversion = {
  id: string
  nome: string | null
  telefone: string | null
  academiaNome: string | null
  createdAt: string
}

const LIMIT = 50

// Últimos clientes inseridos via sync do Alle Documentos (conversions, origem
// 'ane' — ver sync-alle-documentos.ts), mais recente primeiro. Só o essencial pra
// conferir rápido quem entrou; gestão completa (status, edição, exclusão,
// filtros) é em /convertidos.
export async function fetchSyncedConversions(): Promise<SyncedConversion[]> {
  const { rows } = await pool.query<{
    id: string
    nome: string | null
    telefone: string | null
    academia_nome: string | null
    created_at: string
  }>(
    `select c.id, c.nome, c.telefone, a.nome as academia_nome, c.created_at
     from conversions c
     left join academias a on a.id = c.academia_id
     order by c.created_at desc
     limit $1`,
    [LIMIT]
  )

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    academiaNome: row.academia_nome,
    createdAt: row.created_at,
  }))
}
