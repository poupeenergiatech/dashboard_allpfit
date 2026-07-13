import { pool } from '@/lib/db/pool'

// Acesso restrito a super_admin — já gated no page-level (/configuracoes) e no action
// correspondente; sem RLS, essa é a única barreira que resta pra essa tabela singleton.
export async function fetchAutoSyncEnabled(): Promise<boolean> {
  const { rows } = await pool.query<{ enabled: boolean }>(
    'select enabled from alle_documentos_sync_settings where id = 1'
  )

  return rows[0]?.enabled ?? false
}
