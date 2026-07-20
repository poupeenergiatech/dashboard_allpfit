import { pool } from '@/lib/db/pool'

export type SyncLogEntry = {
  id: string
  triggeredBy: 'manual' | 'automatico'
  status: 'sucesso' | 'erro'
  totalConvertidos: number | null
  inseridas: number | null
  jaExistentes: number | null
  naoEncontradas: string[]
  semUnidade: number | null
  errorMessage: string | null
  createdAt: string
}

const HISTORY_LIMIT = 20

// Últimas execuções do sync Alle Documentos (ver runAlleDocumentosSync), manuais e
// automáticas misturadas, mais recente primeiro.
export async function fetchSyncHistory(): Promise<SyncLogEntry[]> {
  const { rows } = await pool.query<{
    id: string
    triggered_by: 'manual' | 'automatico'
    status: 'sucesso' | 'erro'
    total_convertidos: number | null
    inseridas: number | null
    ja_existentes: number | null
    nao_encontradas: string[]
    sem_unidade: number | null
    error_message: string | null
    created_at: string
  }>(
    `select id, triggered_by, status, total_convertidos, inseridas, ja_existentes, nao_encontradas, sem_unidade, error_message, created_at
     from alle_documentos_sync_log
     order by created_at desc
     limit $1`,
    [HISTORY_LIMIT]
  )

  return rows.map((row) => ({
    id: row.id,
    triggeredBy: row.triggered_by,
    status: row.status,
    totalConvertidos: row.total_convertidos,
    inseridas: row.inseridas,
    jaExistentes: row.ja_existentes,
    naoEncontradas: row.nao_encontradas ?? [],
    semUnidade: row.sem_unidade,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }))
}
