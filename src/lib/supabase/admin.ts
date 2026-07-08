import { createClient } from '@supabase/supabase-js'

// Client com a service role key — bypassa RLS. Só pode ser usado em código
// que roda exclusivamente no servidor (route handlers, scripts), nunca em
// nada que chegue ao bundle do client.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
