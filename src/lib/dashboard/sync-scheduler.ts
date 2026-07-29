import { pool } from '@/lib/db/pool'
import { runAlleDocumentosSync } from './sync-alle-documentos'

const CHECK_INTERVAL_MS = 15 * 60 * 1000
const TIMEZONE = 'America/Sao_Paulo'
const TARGET_HOURS = [23, 18, 12] // três janelas diárias, horário de Brasília

function dateInTimezone(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

function hourInTimezone(date: Date): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .find((p) => p.type === 'hour')?.value

  // Bug histórico de alguns engines: meia-noite formata como "24" em vez de "00".
  return Number(hour ?? 0) % 24
}

let running = false

// Roda só nas janelas de horário configuradas em TARGET_HOURS, em horário de
// Brasília (America/Sao_Paulo, não UTC — o container pode estar em qualquer
// fuso) — não "a qualquer hora, desde que ainda não tenha rodado nesta janela
// hoje" como antes de virar múltiplas janelas. A checagem a cada 15 min dá 4
// chances dentro de cada hora-alvo (ex.: 23:00, 23:15, 23:30, 23:45) pra pegar o
// horário mesmo se uma checagem específica for perdida. Dedup é por (dia,
// hora-alvo) — não só por dia — senão uma janela bloquearia as demais no mesmo
// dia. Se uma janela inteira for perdida (container fora do ar a hora toda), o
// sync só volta a rodar na próxima janela — sem perda de dado, porque
// runAlleDocumentosSync sempre processa tudo que ainda não foi importado (dedup
// por alle_documento_id), não só "o dia de hoje".
async function checkAndRun(): Promise<void> {
  if (running) return

  const now = new Date()
  const currentHour = hourInTimezone(now)
  if (!TARGET_HOURS.includes(currentHour)) return

  const { rows: settingsRows } = await pool.query<{ enabled: boolean }>(
    'select enabled from alle_documentos_sync_settings where id = 1'
  )
  if (!settingsRows[0]?.enabled) return

  const { rows: lastRunRows } = await pool.query<{ created_at: Date }>(
    `select created_at from alle_documentos_sync_log
     where triggered_by = 'automatico'
     order by created_at desc
     limit 1`
  )
  const lastRun = lastRunRows[0] ? new Date(lastRunRows[0].created_at) : null
  const alreadyRanThisWindow =
    lastRun !== null &&
    dateInTimezone(lastRun) === dateInTimezone(now) &&
    hourInTimezone(lastRun) === currentHour

  if (alreadyRanThisWindow) return

  running = true
  console.log(`[sync-scheduler] sincronização automática (${currentHour}h, horário de Brasília) iniciando...`)
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

  console.log('[sync-scheduler] scheduler do sync automático iniciado (roda por volta de 23h, 18h e 12h, horário de Brasília)')
  checkAndRun().catch((err) => console.error('[sync-scheduler] erro na checagem inicial:', err))
  setInterval(() => {
    checkAndRun().catch((err) => console.error('[sync-scheduler] erro na checagem periódica:', err))
  }, CHECK_INTERVAL_MS)
}
