import { pool } from '@/lib/db/pool'

// ativo/pendente/reprovado sempre contam como conversão (reprovado conta como
// convertido — só não entra no headcount de "Clientes Alle ativos", que filtra por
// status='ativo' separadamente). sem_informacao/com_impedimentos/falta_documentos
// só contam quando a configuração abaixo estiver ligada.
const STATUS_BASE = ['ativo', 'pendente', 'reprovado']
const STATUS_SECUNDARIOS = ['sem_informacao', 'com_impedimentos', 'falta_documentos']

// Liga/desliga se sem_informacao/com_impedimentos/falta_documentos contam como
// conversão no total — desligada por padrão, Super Admin liga em /configuracoes
// (ver IncluirStatusSecundariosToggle). Igual ao padrão de
// fetch-sync-settings.ts/alle_documentos_sync_settings.
export async function fetchIncluirStatusSecundariosConversao(): Promise<boolean> {
  const { rows } = await pool.query<{ incluir_status_secundarios: boolean }>(
    'select incluir_status_secundarios from conversao_status_settings where id = 1'
  )

  return rows[0]?.incluir_status_secundarios ?? false
}

// Lista já resolvida de status de clientes_alle que contam como conversão agora —
// usada pelas 4 queries que somam totalConversoesManual (fetch-funnel-counts,
// fetch-academia-performance, fetch-academias, fetch-gestores-panel).
export async function fetchConversaoStatusesIncluidos(): Promise<string[]> {
  const incluirSecundarios = await fetchIncluirStatusSecundariosConversao()
  return incluirSecundarios ? [...STATUS_BASE, ...STATUS_SECUNDARIOS] : STATUS_BASE
}
