import { pool } from '@/lib/db/pool'
import { runAlleDocumentosSync } from './sync-alle-documentos'

const CHECK_INTERVAL_MS = 15 * 60 * 1000
const TIMEZONE = 'America/Sao_Paulo'
const TARGET_HOUR = 0 // meia-noite, horário de Brasília

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

// Roda só na janela da meia-noite em horário de Brasília (America/Sao_Paulo, não
// UTC — o container pode estar em qualquer fuso) — não "a qualquer hora, desde que
// ainda não tenha rodado hoje" como antes. A checagem a cada 15 min dá 4 chances
// dentro da hora 0 (00:00, 00:15, 00:30, 00:45) pra pegar o horário mesmo se uma
// checagem específica for perdida. Se a janela inteira for perdida (container fora
// do ar a hora toda), o sync só volta a rodar na meia-noite seguinte — sem perda de
// dado, porque runAlleDocumentosSync sempre processa tudo que ainda não foi
// importado (dedup por alle_documento_id), não só "o dia de hoje".
async function checkAndRun(): Promise<void> {
  if (running) return

  const now = new Date()
  if (hourInTimezone(now) !== TARGET_HOUR) return

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
  const lastRunDate = lastRunRows[0] ? dateInTimezone(new Date(lastRunRows[0].created_at)) : null

  if (lastRunDate === dateInTimezone(now)) return

  running = true
  console.log('[sync-scheduler] sincronização automática diária (00h, horário de Brasília) iniciando...')
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

  console.log('[sync-scheduler] scheduler do sync automático diário iniciado (roda por volta de 00h, horário de Brasília)')
  checkAndRun().catch((err) => console.error('[sync-scheduler] erro na checagem inicial:', err))
  setInterval(() => {
    checkAndRun().catch((err) => console.error('[sync-scheduler] erro na checagem periódica:', err))
  }, CHECK_INTERVAL_MS)
}
