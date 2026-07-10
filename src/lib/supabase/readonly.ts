import { createClient } from '@supabase/supabase-js'

// Único uso do Supabase que sobra depois da migração pra Postgres próprio: leitura
// (GET) de tabelas que vivem no projeto Supabase da Alle Energia, ex.: futuramente
// `alle_documentos_clientes`. NUNCA usar esse client para escrita nem para dados do
// dashboard (academias, contacts, user_profiles etc.) — esses agora vivem só no
// Postgres próprio, ver src/lib/db/pool.ts.
export function createReadonlyClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
