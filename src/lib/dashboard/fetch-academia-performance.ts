import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type AcademiaPerformance = {
  academiaId: string
  nome: string
  totalContatos: number
  totalConversoes: number
}

// Lê da view `academia_performance` (db/migrations/0001_init.sql) — já vem agregada.
// Sem RLS, o escopo por academia (coordenador/visualizador só a própria) é aplicado
// aqui via WHERE, no lugar do antigo security_invoker.
export async function fetchAcademiaPerformance(profile: UserProfile): Promise<AcademiaPerformance[]> {
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const { rows } = await pool.query<{
    academia_id: string
    nome: string
    total_contatos: number
    total_conversoes: number
  }>(
    scopedAcademiaId
      ? 'select academia_id, nome, total_contatos, total_conversoes from academia_performance where academia_id = $1 order by nome'
      : 'select academia_id, nome, total_contatos, total_conversoes from academia_performance order by nome',
    scopedAcademiaId ? [scopedAcademiaId] : []
  )

  return rows.map((row) => ({
    academiaId: row.academia_id,
    nome: row.nome,
    totalContatos: row.total_contatos,
    totalConversoes: row.total_conversoes,
  }))
}
