import { createClient } from '@/lib/supabase/server'

export type AcademiaPerformance = {
  academiaId: string
  nome: string
  totalContatos: number
  totalConversoes: number
}

// Server-only (usa o client de sessão via cookies). Lê da view
// `academia_performance` (supabase/migrations/0010) — já vem agregada e com RLS
// aplicada (security_invoker), então cada role só recebe as linhas que pode ver.
export async function fetchAcademiaPerformance(): Promise<AcademiaPerformance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('academia_performance')
    .select('academia_id, nome, total_contatos, total_conversoes')
    .order('nome')

  if (error) throw error

  return (data ?? []).map((row) => ({
    academiaId: row.academia_id,
    nome: row.nome,
    totalContatos: row.total_contatos,
    totalConversoes: row.total_conversoes,
  }))
}
