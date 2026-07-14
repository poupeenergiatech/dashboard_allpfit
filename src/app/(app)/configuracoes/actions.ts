'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'
import { runAlleDocumentosSync, type SyncAlleDocumentosResult } from '@/lib/dashboard/sync-alle-documentos'

export type { SyncAlleDocumentosResult }

// Disparo manual (botão em /configuracoes) do sync — ver runAlleDocumentosSync pra
// lógica de matching. O disparo automático roda sozinho, uma vez por dia, pelo
// scheduler embutido no processo do servidor (src/lib/dashboard/sync-scheduler.ts,
// ligado/desligado por setAutoSyncEnabled abaixo); o endpoint /api/sync-alle-documentos
// continua existindo como alternativa via cron externo. Os três gravam em
// alle_documentos_sync_log (fetchSyncHistory), então o histórico da tela cobre todas
// as origens.
export async function syncAlleDocumentosConvertidos(): Promise<SyncAlleDocumentosResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode sincronizar conversões.')
  }

  const result = await runAlleDocumentosSync('manual')

  revalidatePath('/configuracoes')
  revalidatePath('/performance')
  revalidatePath('/')

  return result
}

export async function setAutoSyncEnabled(enabled: boolean) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode ativar/desativar a sincronização automática.')
  }

  await pool.query('update alle_documentos_sync_settings set enabled = $1, updated_at = now() where id = 1', [
    enabled,
  ])

  revalidatePath('/configuracoes')
}
