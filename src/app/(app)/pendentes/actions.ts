'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canWrite, getCurrentUserProfile } from '@/lib/supabase/profile'

// Chamada diretamente do client (MarkSignedButton) para poder mostrar toast de
// sucesso/erro — revalidatePath() ainda dispara o refetch do Server Component
// mesmo sem passar por um <form action>.
export async function markAsSigned(id: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canWrite(profile.role)) {
    throw new Error('Sem permissão para marcar como assinado.')
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('pending_signatures')
    .update({ assinado: true, assinado_em: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/pendentes')
}
