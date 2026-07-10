import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type TreinadaStatus = {
  academiaId: string
  nome: string
  treinada: boolean
}

export async function fetchTreinadas(profile: UserProfile): Promise<TreinadaStatus[]> {
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const { rows } = await pool.query<{ academia_id: string; nome: string; treinada: boolean | null }>(
    `select a.id as academia_id, a.nome, t.treinada
     from academias a
     left join trained_academias t on t.academia_id = a.id
     where a.ativo = true
       and ($1::uuid is null or a.id = $1)
     order by a.nome`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    academiaId: row.academia_id,
    nome: row.nome,
    treinada: row.treinada ?? false,
  }))
}
