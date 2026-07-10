import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'
import type { Academia } from './types'

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
