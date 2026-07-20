import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'

export type ClienteConvertido = {
  id: string
  academiaId: string | null
  academiaNome: string | null
  nome: string | null
  telefone: string | null
  clienteAlleId: string | null
  createdAt: string
}

// Clientes convertidos pela Ane (conversions, alimentada pelo sync do Alle
// Documentos — ver sync-alle-documentos.ts), com nome/telefone capturados na
// origem. academiaId/academiaNome vêm null quando o convertido tinha
// unidade_allpfit em branco no Alle Documentos (semUnidade do resultado do sync) —
// só aparecem aqui pra quem enxerga todas as academias: scopeAcademiaId sempre
// resolve pra uma academia real quando o role é escopado (coordenador/
// visualizador), então esses registros null nunca entram no filtro deles.
// clienteAlleId vem preenchido depois que alguém confirma que a pessoa assinou o
// termo de adesão (promoverClienteConvertido, em convertidos/actions.ts) — vira
// cliente Alle ativo.
export async function fetchClientesConvertidos(
  profile: UserProfile,
  requestedAcademiaId?: string | null
): Promise<ClienteConvertido[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const { rows } = await pool.query<{
    id: string
    academia_id: string | null
    academia_nome: string | null
    nome: string | null
    telefone: string | null
    cliente_alle_id: string | null
    created_at: string
  }>(
    `select c.id, c.academia_id, a.nome as academia_nome, c.nome, c.telefone, c.cliente_alle_id, c.created_at
     from conversions c
     left join academias a on a.id = c.academia_id
     where ($1::uuid is null or c.academia_id = $1)
     order by c.created_at desc`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    id: row.id,
    academiaId: row.academia_id,
    academiaNome: row.academia_nome,
    nome: row.nome,
    telefone: row.telefone,
    clienteAlleId: row.cliente_alle_id,
    createdAt: row.created_at,
  }))
}
