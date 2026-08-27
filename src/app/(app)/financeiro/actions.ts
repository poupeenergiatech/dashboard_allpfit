'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageNotasFiscais, canValidateNotasFiscais, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'
import { deleteNotaFiscalPdf, keyFromNotaFiscalUrl, uploadNotaFiscalPdf } from '@/lib/storage/s3'
import type { NotaFiscalStatus, NotaFiscalTipo } from '@/lib/dashboard/fetch-notas-fiscais'
import { fetchClientesConvertidosDoMes, type ClienteConvertidoDoMes } from '@/lib/dashboard/fetch-clientes-convertidos-mes'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB — nota fiscal em PDF não costuma passar disso.

function parseTipo(value: FormDataEntryValue | null): NotaFiscalTipo {
  if (value === 'unidade' || value === 'individual') return value
  throw new Error('Tipo de nota fiscal inválido.')
}

export async function uploadNotaFiscal(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageNotasFiscais(profile.role)) {
    throw new Error('Sem permissão para anexar notas fiscais.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const tipo = parseTipo(formData.get('tipo'))
  const ano = Number(formData.get('ano'))
  const mes = Number(formData.get('mes'))
  const file = formData.get('arquivo')

  if (!requestedAcademiaId) throw new Error('Selecione uma academia.')
  if (!Number.isInteger(ano)) throw new Error('Ano inválido.')
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new Error('Mês inválido.')
  if (!(file instanceof File) || file.size === 0) throw new Error('Selecione um arquivo PDF.')
  if (file.type !== 'application/pdf') throw new Error('Só arquivos PDF são aceitos.')
  if (file.size > MAX_SIZE_BYTES) throw new Error('Arquivo maior que 10MB.')

  // canManageNotasFiscais hoje só libera super_admin/gestor, e os dois enxergam todas
  // as academias (seesAllAcademias) — scopeAcademiaId aqui é rede de segurança caso
  // essa permissão passe a incluir uma role escopada no futuro (mesmo padrão de
  // clientes-alle/actions.ts).
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (academiaId !== requestedAcademiaId) {
    throw new Error('Sem permissão para anexar nota fiscal dessa academia.')
  }

  const { rows: existentes } = await pool.query<{ arquivo_url: string; status: NotaFiscalStatus }>(
    `select arquivo_url, status from notas_fiscais
     where academia_id = $1 and tipo = $2 and competencia_ano = $3 and competencia_mes = $4`,
    [academiaId, tipo, ano, mes]
  )

  // Nota já validada só é trocada excluindo antes (ação deliberada, botão já
  // existente) — protege um documento aprovado de ser sobrescrito num reenvio de
  // 1 clique. Checado nesse server action, não só escondendo o botão no client
  // (mesmo espírito de scopeAcademiaId logo acima).
  if (existentes[0]?.status === 'validado') {
    throw new Error('Essa nota já foi validada — exclua antes de anexar uma nova.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = `notas-fiscais/${academiaId}/${ano}/${String(mes).padStart(2, '0')}/${tipo}-${randomUUID()}.pdf`
  const arquivoUrl = await uploadNotaFiscalPdf(key, buffer)

  await pool.query(
    `insert into notas_fiscais
       (academia_id, tipo, competencia_ano, competencia_mes, arquivo_url, nome_arquivo, tamanho_bytes, uploaded_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (academia_id, tipo, competencia_ano, competencia_mes) do update
       set arquivo_url = excluded.arquivo_url,
           nome_arquivo = excluded.nome_arquivo,
           tamanho_bytes = excluded.tamanho_bytes,
           uploaded_by = excluded.uploaded_by,
           created_at = now(),
           status = 'pendente',
           validated_by = null,
           validated_by_email = null,
           validated_at = null`,
    [academiaId, tipo, ano, mes, arquivoUrl, file.name, file.size, profile.userId]
  )

  // Histórico pra Direção/Super Admin (ver fetch-nota-fiscal-historico.ts) — grava o
  // evento ANTES de apagar o PDF antigo do S3, mesma ordem "só apaga depois de
  // garantir que o resto já está salvo" do bloco abaixo.
  await pool.query(
    `insert into notas_fiscais_historico
       (academia_id, tipo, competencia_ano, competencia_mes, acao, nome_arquivo, tamanho_bytes, performed_by, performed_by_email)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      academiaId,
      tipo,
      ano,
      mes,
      existentes[0] ? 'substituicao' : 'upload',
      file.name,
      file.size,
      profile.userId,
      profile.email ?? '(email desconhecido)',
    ]
  )

  // Apaga o PDF antigo só depois que o novo já está salvo no banco — se a troca
  // falhasse antes, o arquivo antigo continuaria acessível em vez de já ter sumido.
  if (existentes[0]) {
    await deleteNotaFiscalPdf(keyFromNotaFiscalUrl(existentes[0].arquivo_url)).catch(() => {})
  }

  revalidatePath('/financeiro')
}

export async function deleteNotaFiscal(id: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageNotasFiscais(profile.role)) {
    throw new Error('Sem permissão para excluir notas fiscais.')
  }

  const { rows } = await pool.query<{
    arquivo_url: string
    academia_id: string
    tipo: NotaFiscalTipo
    competencia_ano: number
    competencia_mes: number
    nome_arquivo: string
    tamanho_bytes: number
  }>(
    `select arquivo_url, academia_id, tipo, competencia_ano, competencia_mes, nome_arquivo, tamanho_bytes
     from notas_fiscais where id = $1`,
    [id]
  )
  const row = rows[0]
  if (!row) throw new Error('Nota fiscal não encontrada.')

  if (scopeAcademiaId(profile, row.academia_id) !== row.academia_id) {
    throw new Error('Sem permissão para excluir nota fiscal dessa academia.')
  }

  await pool.query('delete from notas_fiscais where id = $1', [id])

  // Histórico pra Direção/Super Admin — mesma tabela usada em uploadNotaFiscal.
  await pool.query(
    `insert into notas_fiscais_historico
       (academia_id, tipo, competencia_ano, competencia_mes, acao, nome_arquivo, tamanho_bytes, performed_by, performed_by_email)
     values ($1, $2, $3, $4, 'exclusao', $5, $6, $7, $8)`,
    [
      row.academia_id,
      row.tipo,
      row.competencia_ano,
      row.competencia_mes,
      row.nome_arquivo,
      row.tamanho_bytes,
      profile.userId,
      profile.email ?? '(email desconhecido)',
    ]
  )

  await deleteNotaFiscalPdf(keyFromNotaFiscalUrl(row.arquivo_url)).catch(() => {})

  revalidatePath('/financeiro')
}

// Revisão de Direção/Super Admin sobre um arquivo já anexado — pedido explícito do
// usuário. Diferente de uploadNotaFiscal/deleteNotaFiscal (que mexem no ARQUIVO,
// exclusivo de canManageNotasFiscais), aqui só o status muda; o arquivo em si nem é
// tocado. Gestor não valida a própria nota (canValidateNotasFiscais não inclui
// gestor), e todo evento fica no mesmo histórico de notas_fiscais_historico, com
// acao prefixado "status_" pra distinguir de upload/substituicao/exclusao.
export async function setNotaFiscalStatus(id: string, status: NotaFiscalStatus) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canValidateNotasFiscais(profile.role)) {
    throw new Error('Sem permissão para validar notas fiscais.')
  }

  const { rows } = await pool.query<{
    academia_id: string
    tipo: NotaFiscalTipo
    competencia_ano: number
    competencia_mes: number
    nome_arquivo: string
    tamanho_bytes: number
  }>(
    `select academia_id, tipo, competencia_ano, competencia_mes, nome_arquivo, tamanho_bytes
     from notas_fiscais where id = $1`,
    [id]
  )
  const row = rows[0]
  if (!row) throw new Error('Nota fiscal não encontrada.')

  if (scopeAcademiaId(profile, row.academia_id) !== row.academia_id) {
    throw new Error('Sem permissão para validar nota fiscal dessa academia.')
  }

  await pool.query(
    `update notas_fiscais
       set status = $2, validated_by = $3, validated_by_email = $4, validated_at = now()
     where id = $1`,
    [id, status, profile.userId, profile.email ?? '(email desconhecido)']
  )

  await pool.query(
    `insert into notas_fiscais_historico
       (academia_id, tipo, competencia_ano, competencia_mes, acao, nome_arquivo, tamanho_bytes, performed_by, performed_by_email)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      row.academia_id,
      row.tipo,
      row.competencia_ano,
      row.competencia_mes,
      `status_${status}`,
      row.nome_arquivo,
      row.tamanho_bytes,
      profile.userId,
      profile.email ?? '(email desconhecido)',
    ]
  )

  revalidatePath('/financeiro')
}

// "Verificar os clientes convertidos daquele mês" — drill-down da linha de
// financeiro_valor_mensal_unidade (unidade + competência) pra lista de pessoas,
// exclusivo de Super Admin (mesma régua de /clientes-alle e /configuracoes,
// canManageManualData). Direção e Gestor continuam vendo os valores agregados em
// /financeiro, só não este detalhamento pessoa a pessoa.
export async function listarClientesConvertidosDoMes(
  academiaId: string,
  ano: number,
  mes: number
): Promise<ClienteConvertidoDoMes[]> {
  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Sem permissão para ver os clientes convertidos.')
  }

  return fetchClientesConvertidosDoMes(profile, academiaId, ano, mes)
}
