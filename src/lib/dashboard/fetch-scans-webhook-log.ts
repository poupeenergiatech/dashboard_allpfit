import { pool } from '@/lib/db/pool'

export type ScansDistribuicaoEntry = {
  academiaLabel: string | null
  academiaId: string | null
  academiaNome: string | null
  totalScans: number | null
}

export type ScansWebhookLogEntry = {
  id: string
  status: 'sucesso' | 'erro'
  payload: unknown
  distribuicao: ScansDistribuicaoEntry[]
  totalAcademias: number | null
  totalAcademiasOk: number | null
  academiasNaoEncontradas: string[]
  errorMessage: string | null
  createdAt: string
}

const HISTORY_LIMIT = 20

// Últimas chamadas recebidas em /api/webhooks/scans, mais recente primeiro.
export async function fetchScansWebhookLog(): Promise<ScansWebhookLogEntry[]> {
  const { rows } = await pool.query<{
    id: string
    status: 'sucesso' | 'erro'
    payload: unknown
    distribuicao: {
      academia_label: string | null
      academia_id: string | null
      academia_nome: string | null
      total_scans: number | null
    }[]
    total_academias: number | null
    total_academias_ok: number | null
    academias_nao_encontradas: string[]
    error_message: string | null
    created_at: string
  }>(
    `select id, status, payload, distribuicao, total_academias, total_academias_ok,
            academias_nao_encontradas, error_message, created_at
     from scans_webhook_log
     order by created_at desc
     limit $1`,
    [HISTORY_LIMIT]
  )

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    payload: row.payload,
    distribuicao: (row.distribuicao ?? []).map((d) => ({
      academiaLabel: d.academia_label,
      academiaId: d.academia_id,
      academiaNome: d.academia_nome,
      totalScans: d.total_scans,
    })),
    totalAcademias: row.total_academias,
    totalAcademiasOk: row.total_academias_ok,
    academiasNaoEncontradas: row.academias_nao_encontradas ?? [],
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }))
}
