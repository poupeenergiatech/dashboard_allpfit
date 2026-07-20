import { pool } from '@/lib/db/pool'
import { createReadonlyClient } from '@/lib/supabase/readonly'
import { buildAcademiaNomeResolver } from '@/lib/dashboard/resolve-academia-by-nome'

type AlleDocumentoClienteRow = {
  id: number
  unidade_allpfit: string | null
  completo: string | null
  pos_venda: string | null
  created_at: string | null
  nome: string | null
  telefone: string | null
}

function isFilled(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export type SyncAlleDocumentosResult = {
  totalConvertidos: number
  inseridas: number
  jaExistentes: number
  naoEncontradas: string[]
  semUnidade: number
}

export type SyncTrigger = 'manual' | 'automatico'

// Único uso de escrita indireta a partir do Supabase: lê (GET, somente leitura,
// src/lib/supabase/readonly.ts) a tabela `alle_documentos_clientes` — que não é
// nossa, é do sistema de vendas/documentos da Alle Energia — e replica só os
// clientes convertidos (completo + pos_venda preenchidos), com nome/telefone, como
// linhas em `conversions`, aqui no nosso Postgres — visíveis depois em /convertidos.
// `alle_documento_id` garante que rodar de novo não duplica (on conflict do
// nothing). unidade_allpfit é texto livre do lado deles; o vínculo com a academia é
// resolvido em 3 passos (ver resolveAcademiaId): nome exato normalizado, nome sem
// acento/hífen (só se único), e por fim academia_aliases (nomes vinculados
// manualmente em /academias). Nome preenchido que não bate com nada vira
// `naoEncontradas` pra vínculo manual (não insere ainda); unidade em branco de
// verdade (sem nome nenhum pra vincular) insere com academia_id null — contado em
// `semUnidade`, só dá pra resolver corrigindo a origem.
//
// Chamada tanto pela action manual (app/(app)/configuracoes/actions.ts, atrás de
// checagem de Super Admin) quanto pelo endpoint de cron (app/api/sync-alle-documentos,
// atrás de CRON_SECRET) — cada execução, com sucesso ou erro, vira uma linha em
// alle_documentos_sync_log (ver fetchSyncHistory) pra dar visibilidade de quando e
// como cada sync rodou.
export async function runAlleDocumentosSync(triggeredBy: SyncTrigger): Promise<SyncAlleDocumentosResult> {
  try {
    const result = await syncAlleDocumentosConvertidos()

    await pool.query(
      `insert into alle_documentos_sync_log
         (triggered_by, status, total_convertidos, inseridas, ja_existentes, nao_encontradas, sem_unidade)
       values ($1, 'sucesso', $2, $3, $4, $5, $6)`,
      [
        triggeredBy,
        result.totalConvertidos,
        result.inseridas,
        result.jaExistentes,
        JSON.stringify(result.naoEncontradas),
        result.semUnidade,
      ]
    )

    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao sincronizar.'
    await pool.query(
      `insert into alle_documentos_sync_log (triggered_by, status, error_message)
       values ($1, 'erro', $2)`,
      [triggeredBy, message]
    )
    throw err
  }
}

async function syncAlleDocumentosConvertidos(): Promise<SyncAlleDocumentosResult> {
  const supabase = createReadonlyClient()
  const { data, error } = await supabase
    .from('alle_documentos_clientes')
    .select('id, unidade_allpfit, completo, pos_venda, created_at, nome, telefone')
    .returns<AlleDocumentoClienteRow[]>()

  if (error) {
    throw new Error(`Falha ao consultar o Supabase: ${error.message}`)
  }

  const convertidos = (data ?? []).filter((row) => isFilled(row.completo) && isFilled(row.pos_venda))

  const { rows: academias } = await pool.query<{ id: string; nome: string }>('select id, nome from academias')
  const { rows: aliases } = await pool.query<{ alias_nome: string; academia_id: string }>(
    'select alias_nome, academia_id from academia_aliases'
  )

  const resolveAcademiaId = buildAcademiaNomeResolver(academias, aliases)

  let inseridas = 0
  let jaExistentes = 0
  let semUnidade = 0
  const naoEncontradas = new Set<string>()

  for (const row of convertidos) {
    const unidade = (row.unidade_allpfit ?? '').trim()
    const nome = (row.nome ?? '').trim() || null
    const telefone = (row.telefone ?? '').trim() || null
    const academiaId = resolveAcademiaId(unidade)

    if (!academiaId && unidade) {
      // Unidade preenchida mas sem academia/alias correspondente — Super Admin
      // resolve criando um alias em /academias (ver NaoEncontradaRow no botão de
      // sync); a próxima execução já insere certo. Não insere aqui: sem
      // academia_id não dá pra saber onde esse cliente entra no funil.
      naoEncontradas.add(unidade)
      continue
    }

    if (!academiaId) {
      // Unidade em branco de verdade (não é "não encontrada" — não tem nome de
      // unidade nenhum pra vincular por alias). Insere mesmo assim, com
      // academia_id null, pra não sumir da lista de clientes convertidos
      // (/convertidos) — é lá que dá pra ver nome/telefone e ir corrigir a
      // unidade na origem. Sem isso o registro desaparecia de totalConvertidos
      // sem aparecer em nenhum lugar do resultado.
      semUnidade++
    }

    const { rowCount } = await pool.query(
      `insert into conversions (academia_id, created_at, alle_documento_id, nome, telefone)
       values ($1, $2, $3, $4, $5)
       on conflict (alle_documento_id) do nothing`,
      [academiaId ?? null, row.created_at ?? new Date().toISOString(), row.id, nome, telefone]
    )

    if (academiaId) {
      if (rowCount) inseridas++
      else jaExistentes++
    }
  }

  return {
    totalConvertidos: convertidos.length,
    inseridas,
    jaExistentes,
    naoEncontradas: [...naoEncontradas],
    semUnidade,
  }
}
