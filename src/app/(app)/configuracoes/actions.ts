'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { buildReportPayload } from '@/lib/dashboard/build-report-payload'
import { sendReportWebhook } from '@/lib/dashboard/send-report-webhook'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'
import { createReadonlyClient } from '@/lib/supabase/readonly'

function assertSuperAdmin(role: string | undefined) {
  if (role !== 'super_admin') {
    throw new Error('Apenas Super Admin pode gerenciar o destino do relatório.')
  }
}

export async function saveReportWebhookUrl(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode alterar o destino do relatório.')
  }

  const url = String(formData.get('webhook_url') ?? '').trim()

  if (url) {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error('URL inválida — use um endereço http(s) completo.')
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('URL inválida — use um endereço http(s) completo.')
    }
  }

  // Sem RLS, o check de canManageUsers acima é a barreira de verdade pra essa tabela.
  await pool.query('update report_settings set webhook_url = $1, updated_at = now() where id = 1', [
    url || null,
  ])

  revalidatePath('/configuracoes')
}

// Dispara manualmente o mesmo fluxo do cron (/api/relatorio) pra validar a URL configurada
// sem esperar a meia-noite. Retorna o total de contatos enviados pra feedback na UI.
export async function sendReportNow(formData: FormData) {
  const profile = await getCurrentUserProfile()
  assertSuperAdmin(profile?.role)

  const dataStr = String(formData.get('data') ?? '').trim()
  let reportDate: Date
  if (dataStr) {
    reportDate = new Date(`${dataStr}T00:00:00`)
    if (Number.isNaN(reportDate.getTime())) throw new Error('Data inválida.')
  } else {
    reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - 1)
  }

  const payload = await buildReportPayload(reportDate)
  const result = await sendReportWebhook(payload)

  if (!result.sent) {
    throw new Error(result.error ?? `O webhook respondeu com status ${result.status}.`)
  }

  return { total: payload.total_novos_contatos, data: payload.data_relatorio }
}

type AlleDocumentoClienteRow = {
  id: number
  unidade_allpfit: string | null
  completo: string | null
  pos_venda: string | null
  created_at: string | null
}

function isFilled(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeNome(value: string): string {
  return value.trim().toLowerCase()
}

export type SyncAlleDocumentosResult = {
  totalConvertidos: number
  inseridas: number
  jaExistentes: number
  naoEncontradas: string[]
}

// Único uso de escrita indireta a partir do Supabase: lê (GET, somente leitura,
// src/lib/supabase/readonly.ts) a tabela `alle_documentos_clientes` — que não é
// nossa, é do sistema de vendas/documentos da Alle Energia — e replica só os
// clientes convertidos (completo + pos_venda preenchidos) como linhas em
// `conversions`, aqui no nosso Postgres. `alle_documento_id` garante que rodar de
// novo não duplica (on conflict do nothing). unidade_allpfit é texto livre do lado
// deles; o vínculo com a academia é por igualdade de nome (case-insensitive) —
// unidades que não baterem exato voltam na lista `naoEncontradas` pra revisão manual.
export async function syncAlleDocumentosConvertidos(): Promise<SyncAlleDocumentosResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode sincronizar conversões.')
  }

  const supabase = createReadonlyClient()
  const { data, error } = await supabase
    .from('alle_documentos_clientes')
    .select('id, unidade_allpfit, completo, pos_venda, created_at')
    .returns<AlleDocumentoClienteRow[]>()

  if (error) {
    throw new Error(`Falha ao consultar o Supabase: ${error.message}`)
  }

  const convertidos = (data ?? []).filter((row) => isFilled(row.completo) && isFilled(row.pos_venda))

  const { rows: academias } = await pool.query<{ id: string; nome: string }>('select id, nome from academias')
  const academiaIdByNome = new Map(academias.map((a) => [normalizeNome(a.nome), a.id]))

  let inseridas = 0
  let jaExistentes = 0
  const naoEncontradas = new Set<string>()

  for (const row of convertidos) {
    const unidade = (row.unidade_allpfit ?? '').trim()
    const academiaId = academiaIdByNome.get(normalizeNome(unidade))

    if (!academiaId) {
      if (unidade) naoEncontradas.add(unidade)
      continue
    }

    const { rowCount } = await pool.query(
      `insert into conversions (academia_id, created_at, alle_documento_id)
       values ($1, $2, $3)
       on conflict (alle_documento_id) do nothing`,
      [academiaId, row.created_at ?? new Date().toISOString(), row.id]
    )

    if (rowCount) inseridas++
    else jaExistentes++
  }

  revalidatePath('/configuracoes')
  revalidatePath('/performance')
  revalidatePath('/')

  return {
    totalConvertidos: convertidos.length,
    inseridas,
    jaExistentes,
    naoEncontradas: [...naoEncontradas],
  }
}
