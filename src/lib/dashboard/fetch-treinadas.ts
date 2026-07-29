import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type TreinadaStatus = {
  academiaId: string
  nome: string
  ativo: boolean
  treinada: boolean
}

// Diferente da maioria das outras telas (que só listam academias ativas, ver
// fetchActiveAcademias), aqui também entram as inativas — senão uma unidade
// desativada simplesmente sumia da lista, mesmo que ainda faça sentido
// acompanhar se ela chegou a ser treinada. Inativa sempre aparece como
// "pendente" (treinada forçada pra false) e não editável (ver TreinadasGrid) —
// marcar uma unidade desativada como treinada não faz sentido operacional, e
// evitaria o botão "ligar" reverter sozinho no próximo fetch.
export async function fetchTreinadas(profile: UserProfile): Promise<TreinadaStatus[]> {
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const { rows } = await pool.query<{ academia_id: string; nome: string; ativo: boolean; treinada: boolean | null }>(
    `select a.id as academia_id, a.nome, a.ativo, t.treinada
     from academias a
     left join trained_academias t on t.academia_id = a.id
     where ($1::uuid is null or a.id = $1)
     order by a.nome`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    academiaId: row.academia_id,
    nome: row.nome,
    ativo: row.ativo,
    treinada: row.ativo && (row.treinada ?? false),
  }))
}
