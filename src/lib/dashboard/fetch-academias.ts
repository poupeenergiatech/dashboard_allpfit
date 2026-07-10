import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'
import type { Academia } from './types'

export type AcademiaAdmin = {
  id: string
  nome: string
  numeroTelefone: string | null
  ativo: boolean
}

// Todas as academias (ativas e inativas), com os campos administrativos —
// usado só em /academias (Super Admin). fetchActiveAcademias, abaixo, continua
// sendo a fonte pros dropdowns/abas do resto do app.
export async function fetchAllAcademias(): Promise<AcademiaAdmin[]> {
  const { rows } = await pool.query<{
    id: string
    nome: string
    numero_telefone: string | null
    ativo: boolean
  }>('select id, nome, numero_telefone, ativo from academias order by nome')

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    numeroTelefone: row.numero_telefone,
    ativo: row.ativo,
  }))
}

// Lista de academias ativas, usada em vários módulos (dropdowns, abas do funil etc).
// Sem `profile` (ou com um profile que vê tudo), retorna todas — usado em telas
// restritas a super_admin (ex.: /usuarios) onde escopo por academia não se aplica.
// Com profile de um role escopado, filtra pra só a própria academia (equivalente à
// antiga policy `academias_select`).
export async function fetchActiveAcademias(profile?: UserProfile | null): Promise<Academia[]> {
  const scopedAcademiaId = profile && !seesAllAcademias(profile.role) ? profile.academiaId : null

  const { rows } = await pool.query<{ id: string; nome: string }>(
    scopedAcademiaId
      ? 'select id, nome from academias where ativo = true and id = $1 order by nome'
      : 'select id, nome from academias where ativo = true order by nome',
    scopedAcademiaId ? [scopedAcademiaId] : []
  )

  return rows
}
