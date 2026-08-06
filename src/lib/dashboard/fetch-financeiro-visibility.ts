import { pool } from '@/lib/db/pool'

// Ligada (visível) por padrão — ver setFinanceiroVisivelOutrosCargos em
// configuracoes/actions.ts e o toggle em /configuracoes. Super Admin não passa por
// essa checagem em nenhum lugar (financeiro/page.tsx e AppLayout só chamam isso
// quando profile.role !== 'super_admin').
export async function fetchFinanceiroVisivelOutrosCargos(): Promise<boolean> {
  const { rows } = await pool.query<{ visivel_outros_cargos: boolean }>(
    'select visivel_outros_cargos from financeiro_visibility_settings where id = 1'
  )

  return rows[0]?.visivel_outros_cargos ?? true
}
