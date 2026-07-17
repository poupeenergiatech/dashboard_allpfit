import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type ManualDataEntry = {
  id: string
  academiaId: string
  academiaNome: string
  data: string
  totalScans: number
  contatosAjuste: number | null
  conversoesAjuste: number | null
  reprovados: number
}

const HISTORY_LIMIT = 90

// Últimos lançamentos manuais (mais recente primeiro) — usado pra revisar/editar
// um dia já lançado em vez de só permitir sobrescrever a data de hoje.
export async function fetchManualDataHistory(profile: UserProfile): Promise<ManualDataEntry[]> {
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  const { rows } = await pool.query<{
    id: string
    academia_id: string
    academia_nome: string
    data: string
    total_scans: number
    contatos_ajuste: number | null
    conversoes_ajuste: number | null
    reprovados: number
  }>(
    `select md.id, md.academia_id, a.nome as academia_nome, md.data, md.total_scans,
            md.contatos_ajuste, md.conversoes_ajuste, md.reprovados
     from manual_data md
     join academias a on a.id = md.academia_id
     where ($1::uuid is null or md.academia_id = $1)
     order by md.data desc, a.nome asc
     limit $2`,
    [scopedAcademiaId, HISTORY_LIMIT]
  )

  return rows.map((row) => ({
    id: row.id,
    academiaId: row.academia_id,
    academiaNome: row.academia_nome,
    data: row.data,
    totalScans: row.total_scans,
    contatosAjuste: row.contatos_ajuste,
    conversoesAjuste: row.conversoes_ajuste,
    reprovados: row.reprovados,
  }))
}
