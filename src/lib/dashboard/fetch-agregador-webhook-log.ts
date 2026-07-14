import { pool } from '@/lib/db/pool'

export type WebhookDistribuicaoEntry = {
  academiaLabel: string | null
  telefoneNumero: string | null
  academiaId: string | null
  academiaNome: string | null
  matchedBy: 'nome' | 'telefone' | null
  contatosRecebidos: number
  contatosInseridos: number
  contatosIgnorados: number
}

export type AgregadorWebhookLogEntry = {
  id: string
  status: 'sucesso' | 'erro'
  payload: unknown
  distribuicao: WebhookDistribuicaoEntry[]
  totalRecebido: number | null
  totalInserido: number | null
  totalIgnorado: number | null
  academiasNaoEncontradas: string[]
  errorMessage: string | null
  createdAt: string
}

const HISTORY_LIMIT = 20

// Últimas chamadas recebidas em /api/webhooks/agregador, mais recente primeiro — payload
// bruto + como cada bloco foi distribuído entre as academias (ver logWebhookCall na rota).
export async function fetchAgregadorWebhookLog(): Promise<AgregadorWebhookLogEntry[]> {
  const { rows } = await pool.query<{
    id: string
    status: 'sucesso' | 'erro'
    payload: unknown
    distribuicao: {
      academia_label: string | null
      telefone_numero: string | null
      academia_id: string | null
      academia_nome: string | null
      matched_by: 'nome' | 'telefone' | null
      contatos_recebidos: number
      contatos_inseridos: number
      contatos_ignorados: number
    }[]
    total_recebido: number | null
    total_inserido: number | null
    total_ignorado: number | null
    academias_nao_encontradas: string[]
    error_message: string | null
    created_at: string
  }>(
    `select id, status, payload, distribuicao, total_recebido, total_inserido, total_ignorado,
            academias_nao_encontradas, error_message, created_at
     from agregador_webhook_log
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
      telefoneNumero: d.telefone_numero,
      academiaId: d.academia_id,
      academiaNome: d.academia_nome,
      matchedBy: d.matched_by ?? null,
      contatosRecebidos: d.contatos_recebidos,
      contatosInseridos: d.contatos_inseridos,
      contatosIgnorados: d.contatos_ignorados,
    })),
    totalRecebido: row.total_recebido,
    totalInserido: row.total_inserido,
    totalIgnorado: row.total_ignorado,
    academiasNaoEncontradas: row.academias_nao_encontradas ?? [],
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }))
}
