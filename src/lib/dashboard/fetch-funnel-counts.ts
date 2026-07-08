import { createClient } from '@/lib/supabase/client'
import { periodRange } from './period'
import type { FunnelCounts, Period } from './types'

// PREMISSA A VALIDAR: assume que `contacts` e `conversions` (tabelas já existentes,
// segundo o documento de sprints) têm uma coluna `created_at` timestamptz — é o padrão
// do Supabase, mas como o schema real dessas tabelas não foi inspecionado, ajuste o nome
// da coluna aqui se for diferente (ex.: `data`, `timestamp`, `inserted_at`).
const CONTACTS_DATE_COLUMN = 'created_at'
const CONVERSIONS_DATE_COLUMN = 'created_at'

export async function fetchFunnelCounts(
  academiaId: string | null,
  period: Period
): Promise<FunnelCounts> {
  const supabase = createClient()
  const { from, fromDate } = periodRange(period)

  let contactsQuery = supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .gte(CONTACTS_DATE_COLUMN, from)

  let conversionsQuery = supabase
    .from('conversions')
    .select('id', { count: 'exact', head: true })
    .gte(CONVERSIONS_DATE_COLUMN, from)

  let manualDataQuery = supabase
    .from('manual_data')
    .select('academia_id, data, total_alunos, total_scans')
    .gte('data', fromDate)

  if (academiaId) {
    contactsQuery = contactsQuery.eq('academia_id', academiaId)
    conversionsQuery = conversionsQuery.eq('academia_id', academiaId)
    manualDataQuery = manualDataQuery.eq('academia_id', academiaId)
  }

  const [{ count: totalContatos, error: contactsError }, { count: totalConversoes, error: conversionsError }, {
    data: manualRows,
    error: manualError,
  }] = await Promise.all([contactsQuery, conversionsQuery, manualDataQuery])

  if (contactsError) throw contactsError
  if (conversionsError) throw conversionsError
  if (manualError) throw manualError

  // total_alunos é um snapshot (não é aditivo): pega o valor mais recente dentro do
  // período, por academia, e soma entre academias quando o filtro é "todas".
  // total_scans é aditivo: soma direta de todas as linhas do período.
  const latestAlunosByAcademia = new Map<string, { data: string; total_alunos: number }>()
  let totalScans = 0

  for (const row of manualRows ?? []) {
    totalScans += row.total_scans ?? 0
    const prev = latestAlunosByAcademia.get(row.academia_id)
    if (!prev || row.data > prev.data) {
      latestAlunosByAcademia.set(row.academia_id, row)
    }
  }

  const totalAlunos = [...latestAlunosByAcademia.values()].reduce(
    (sum, row) => sum + (row.total_alunos ?? 0),
    0
  )

  return {
    totalAlunos,
    totalScans,
    totalContatos: totalContatos ?? 0,
    totalConversoes: totalConversoes ?? 0,
  }
}
