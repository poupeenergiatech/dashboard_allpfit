import { pool } from '@/lib/db/pool'

// Acesso restrito a super_admin — já gated no page-level (/configuracoes) e nos
// actions correspondentes; sem RLS, essa é a única barreira que resta pra essa tabela
// singleton.
export async function fetchReportWebhookUrl(): Promise<string | null> {
  const { rows } = await pool.query<{ webhook_url: string | null }>(
    'select webhook_url from report_settings where id = 1'
  )

  return rows[0]?.webhook_url ?? null
}
