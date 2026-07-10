import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type PendingSignature = {
  id: string
  nome: string
  academiaNome: string
  dataContato: string
}

export async function fetchPendingSignatures(profile: UserProfile): Promise<PendingSignature[]> {
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const { rows } = await pool.query<{
    id: string
    nome: string
    data_contato: string
    academia_nome: string | null
  }>(
    `select ps.id, ps.nome, ps.data_contato, a.nome as academia_nome
     from pending_signatures ps
     left join academias a on a.id = ps.academia_id
     where ps.assinado = false
       and ($1::uuid is null or ps.academia_id = $1)
     order by ps.data_contato asc`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    academiaNome: row.academia_nome ?? '—',
    dataContato: row.data_contato,
  }))
}
