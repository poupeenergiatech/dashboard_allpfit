import { pool } from '@/lib/db/pool'
import { runAlleDocumentosSync } from './sync-alle-documentos'

const CHECK_INTERVAL_MS = 15 * 60 * 1000

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

let running = false

// "Uma vez por dia" aqui não é um horário fixo — é "ainda não rodou hoje" (comparado
// contra a última linha automática em alle_documentos_sync_log). Isso faz o scheduler
// se auto-corrigir depois de o container reiniciar ou ficar fora do ar por um tempo,
// sem precisar de um horário exato acertado. `running` evita sobrepor duas checagens
// se uma sync anterior ainda não terminou quando o próximo intervalo dispara.
async function checkAndRun(): Promise<void> {
  if (running) return

  const { rows: settingsRows } = await pool.query<{ enabled: boolean }>(
    'select enabled from alle_documentos_sync_settings where id = 1'
  )
  if (!settingsRows[0]?.enabled) return

  const { rows: lastRunRows } = await pool.query<{ created_at: string }>(
    `select created_at from alle_documentos_sync_log
     where triggered_by = 'automatico'
     order by created_at desc
     limit 1`
  )
  const lastRunDate = lastRunRows[0] ? new Date(lastRunRows[0].created_at).toISOString().slice(0, 10) : null

  if (lastRunDate === todayUtc()) return

  running = true
  console.log('[sync-scheduler] sincronização automática diária iniciando...')
  try {
    // Sucesso ou erro, runAlleDocumentosSync já grava em alle_documentos_sync_log —
    // não precisamos tratar o resultado aqui, só deixar rodar.
    await runAlleDocumentosSync('automatico').catch((err) => {
      console.error('[sync-scheduler] falha na sincronização automática:', err)
    })
  } finally {
    running = false
  }
}

const globalForScheduler = globalThis as unknown as { alleDocumentosSyncSchedulerStarted?: boolean }

// Chamada uma vez, em instrumentation.ts, quando o servidor Next sobe (tanto `next
// dev` quanto o server.js standalone de produção). Guard via globalThis pelo mesmo
// motivo do pool do pg (src/lib/db/pool.ts): hot-reload em dev não pode empilhar
// vários setInterval.
export function startAutoSyncScheduler(): void {
  if (globalForScheduler.alleDocumentosSyncSchedulerStarted) return
  globalForScheduler.alleDocumentosSyncSchedulerStarted = true

  console.log('[sync-scheduler] scheduler do sync automático diário iniciado')
  checkAndRun().catch((err) => console.error('[sync-scheduler] erro na checagem inicial:', err))
  setInterval(() => {
    checkAndRun().catch((err) => console.error('[sync-scheduler] erro na checagem periódica:', err))
  }, CHECK_INTERVAL_MS)
}
