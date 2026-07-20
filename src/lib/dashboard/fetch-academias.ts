import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'
import type { Academia } from './types'

export type AcademiaAdmin = {
  id: string
  nome: string
  numeroTelefone: string | null
  ativo: boolean
  totalAlunos: number
  totalConversoesAne: number
  totalConversoesManual: number
  totalConversoes: number
  conversoesManualAjusteTotal: number
}

// Todas as academias (ativas e inativas), com os campos administrativos —
// usado só em /academias (Super Admin). fetchActiveAcademias, abaixo, continua
// sendo a fonte pros dropdowns/abas do resto do app.
//
// totalConversoes é o total efetivo (histórico inteiro: Ane automática + manual
// aditiva + conversoes_manual_ajuste_total) — o mesmo valor que aparece em
// /performance na visão "Todo período". Mesma lógica de
// fetch-academia-performance.ts.
export async function fetchAllAcademias(): Promise<AcademiaAdmin[]> {
  const [{ rows }, { rows: conversoesPorDia }, { rows: manuais }] = await Promise.all([
    pool.query<{
      id: string
      nome: string
      numero_telefone: string | null
      ativo: boolean
      total_alunos: number
      conversoes_manual_ajuste_total: number
    }>(
      'select id, nome, numero_telefone, ativo, total_alunos, conversoes_manual_ajuste_total from academias order by nome'
    ),
    pool.query<{ academia_id: string; day: string; count: number }>(
      `select academia_id, date_trunc('day', created_at)::date as day, count(*) as count from conversions
       group by academia_id, day`
    ),
    pool.query<{ academia_id: string; conversoes_manual: number }>(
      `select academia_id, conversoes_manual from manual_data where conversoes_manual != 0`
    ),
  ])

  const totalConversoesAneByAcademia = new Map<string, number>()
  for (const row of conversoesPorDia) {
    totalConversoesAneByAcademia.set(row.academia_id, (totalConversoesAneByAcademia.get(row.academia_id) ?? 0) + row.count)
  }

  const totalConversoesManualByAcademia = new Map<string, number>()
  for (const row of manuais) {
    totalConversoesManualByAcademia.set(
      row.academia_id,
      (totalConversoesManualByAcademia.get(row.academia_id) ?? 0) + row.conversoes_manual
    )
  }

  return rows.map((row) => {
    const totalConversoesAne = totalConversoesAneByAcademia.get(row.id) ?? 0
    const totalConversoesManual =
      (totalConversoesManualByAcademia.get(row.id) ?? 0) + row.conversoes_manual_ajuste_total
    return {
      id: row.id,
      nome: row.nome,
      numeroTelefone: row.numero_telefone,
      ativo: row.ativo,
      totalAlunos: row.total_alunos,
      totalConversoesAne,
      totalConversoesManual,
      totalConversoes: totalConversoesAne + totalConversoesManual,
      conversoesManualAjusteTotal: row.conversoes_manual_ajuste_total,
    }
  })
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

export type AcademiaAlias = {
  id: string
  aliasNome: string
  academiaId: string
  academiaNome: string
}

// Nomes alternativos cadastrados manualmente pra resolver unidades que o sync do
// Alle Documentos não conseguiu casar por nome — ver syncAlleDocumentosConvertidos
// em app/(app)/configuracoes/actions.ts.
export async function fetchAcademiaAliases(): Promise<AcademiaAlias[]> {
  const { rows } = await pool.query<{ id: string; alias_nome: string; academia_id: string; nome: string }>(
    `select aa.id, aa.alias_nome, aa.academia_id, a.nome
     from academia_aliases aa
     join academias a on a.id = aa.academia_id
     order by aa.alias_nome`
  )

  return rows.map((row) => ({
    id: row.id,
    aliasNome: row.alias_nome,
    academiaId: row.academia_id,
    academiaNome: row.nome,
  }))
}
