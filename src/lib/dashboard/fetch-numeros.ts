import { createClient } from '@/lib/supabase/server'

export type NumeroStatus = {
  academiaId: string
  nome: string
  numeroTelefone: string | null
  ativo: boolean
  mensagensHoje: number
}

// PREMISSA A VALIDAR: "status online/offline" (S4-06) idealmente viria do agregador em
// tempo real, mas não temos esse dado modelado ainda — usamos `academias.ativo` como
// proxy até o agregador expor um status real por número.
export async function fetchNumeros(): Promise<NumeroStatus[]> {
  const supabase = createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [{ data: academias, error: academiasError }, { data: contacts, error: contactsError }] =
    await Promise.all([
      supabase.from('academias').select('id, nome, numero_telefone, ativo').order('nome'),
      supabase.from('contacts').select('academia_id').gte('created_at', todayStart.toISOString()),
    ])

  if (academiasError) throw academiasError
  if (contactsError) throw contactsError

  const countByAcademia = new Map<string, number>()
  for (const row of contacts ?? []) {
    countByAcademia.set(row.academia_id, (countByAcademia.get(row.academia_id) ?? 0) + 1)
  }

  return (academias ?? []).map((a) => ({
    academiaId: a.id,
    nome: a.nome,
    numeroTelefone: a.numero_telefone,
    ativo: a.ativo,
    mensagensHoje: countByAcademia.get(a.id) ?? 0,
  }))
}
