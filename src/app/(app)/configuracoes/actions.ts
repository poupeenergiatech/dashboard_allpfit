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

export type ResetConversoesResult = {
  conversoesAneRemovidas: number
  diasManuaisZerados: number
  academiasZeradas: number
}

// Zera as duas origens de conversão em todas as academias — apaga os registros
// automáticos da Ane (conversions) e os lançamentos manuais/Bitrix (manual_data
// .conversoes_manual por dia + academias.conversoes_manual_ajuste_total). A Ane não
// é um reset permanente: como a fonte (alle_documentos_clientes) continua existindo
// no Supabase, a próxima sincronização (automática ou pelo botão acima) pode trazer
// os mesmos registros de volta. Os lançamentos manuais, sim, são perdidos de
// verdade — não tem de onde vir de volta.
export async function resetAllConversoes(): Promise<ResetConversoesResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode resetar conversões.')
  }

  const client = await pool.connect()
  let result: ResetConversoesResult
  try {
    await client.query('begin')

    const { rowCount: conversoesAneRemovidas } = await client.query('delete from conversions')
    const { rowCount: diasManuaisZerados } = await client.query(
      `update manual_data set conversoes_manual = 0, updated_at = now() where conversoes_manual != 0`
    )
    const { rowCount: academiasZeradas } = await client.query(
      `update academias set conversoes_manual_ajuste_total = 0 where conversoes_manual_ajuste_total != 0`
    )

    await client.query('commit')
    result = {
      conversoesAneRemovidas: conversoesAneRemovidas ?? 0,
      diasManuaisZerados: diasManuaisZerados ?? 0,
      academiasZeradas: academiasZeradas ?? 0,
    }
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  revalidatePath('/')
  revalidatePath('/performance')
  revalidatePath('/academias')
  revalidatePath('/configuracoes')

  return result
}
