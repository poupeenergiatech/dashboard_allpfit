'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canWrite, getCurrentUserProfile } from '@/lib/supabase/profile'

export async function saveManualData(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canWrite(profile.role)) {
    throw new Error('Sem permissão para editar dados manuais.')
  }

  const academiaId = String(formData.get('academia_id') ?? '')
  const data = String(formData.get('data') ?? '')
  const totalAlunos = Number(formData.get('total_alunos') ?? 0)
  const totalScans = Number(formData.get('total_scans') ?? 0)

  if (!academiaId || !data) {
    throw new Error('Academia e data são obrigatórios.')
  }

  const supabase = createClient()
  // RLS é a barreira de verdade aqui: coordenador só consegue upsertar na própria
  // academia (ver supabase/migrations/0008_rls_policies.sql), o check de canWrite acima
  // é só para dar um erro amigável mais cedo.
  const { error } = await supabase.from('manual_data').upsert(
    { academia_id: academiaId, data, total_alunos: totalAlunos, total_scans: totalScans },
    { onConflict: 'academia_id,data' }
  )

  if (error) throw error

  revalidatePath('/performance')
  revalidatePath('/')
}
