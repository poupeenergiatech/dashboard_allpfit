import { createClient } from '@/lib/supabase/server'

export type PendingSignature = {
  id: string
  nome: string
  academiaNome: string
  dataContato: string
}

type PendingSignatureRow = {
  id: string
  nome: string
  data_contato: string
  academias: { nome: string } | null
}

export async function fetchPendingSignatures(): Promise<PendingSignature[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pending_signatures')
    .select('id, nome, data_contato, academias(nome)')
    .eq('assinado', false)
    .order('data_contato', { ascending: true })
    .returns<PendingSignatureRow[]>()

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    academiaNome: row.academias?.nome ?? '—',
    dataContato: row.data_contato,
  }))
}
