import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client para uso em Server Components, Server Actions e Route Handlers.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component — o middleware já
            // cuida de renovar a sessão, então é seguro ignorar aqui.
          }
        },
      },
    }
  )
}
