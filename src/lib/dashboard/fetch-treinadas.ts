import { createClient } from '@/lib/supabase/server'

export type TreinadaStatus = {
  academiaId: string
  nome: string
  treinada: boolean
}

export async function fetchTreinadas(): Promise<TreinadaStatus[]> {
  const supabase = createClient()
  const [{ data: academias, error: academiasError }, { data: trained, error: trainedError }] =
    await Promise.all([
      supabase.from('academias').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('trained_academias').select('academia_id, treinada'),
    ])

  if (academiasError) throw academiasError
  if (trainedError) throw trainedError

  const trainedByAcademia = new Map((trained ?? []).map((t) => [t.academia_id, t.treinada]))

  return (academias ?? []).map((a) => ({
    academiaId: a.id,
    nome: a.nome,
    treinada: trainedByAcademia.get(a.id) ?? false,
  }))
}
