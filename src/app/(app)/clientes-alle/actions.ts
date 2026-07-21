'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageManualData, getCurrentUserProfile, scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'
import { parseCsv } from '@/lib/dashboard/csv'
import { buildAcademiaNomeResolver } from '@/lib/dashboard/resolve-academia-by-nome'
import type { ClienteAlleStatus } from '@/lib/dashboard/fetch-clientes-alle'

// Mesmo guard/escopo de manual_data (performance/actions.ts): clientes_alle é outro
// cadastro manual por academia, sem sincronização automática — mesmo nível de
// permissão faz sentido (super_admin/gestor).
function resolveAcademiaId(profile: UserProfile | null, requestedAcademiaId: string) {
  if (!profile) throw new Error('Sem sessão válida.')
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (academiaId !== requestedAcademiaId) {
    throw new Error('Sem permissão para editar clientes de outra academia.')
  }
  return academiaId
}

function parseStatus(value: FormDataEntryValue | null): ClienteAlleStatus {
  if (value === 'pendente') return 'pendente'
  if (value === 'reprovado') return 'reprovado'
  if (value === 'sem_informacao') return 'sem_informacao'
  return 'ativo'
}

// Só dígitos, pra comparar telefone sem depender de como cada lado formatou (com
// DDI, parênteses, traço...) — nem o CSV nem o Alle Documentos garantem o mesmo
// formato.
function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export async function createClienteAlle(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para cadastrar clientes Alle.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = String(formData.get('telefone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const status = parseStatus(formData.get('status'))

  if (!requestedAcademiaId || !nome) {
    throw new Error('Academia e nome são obrigatórios.')
  }

  if (telefone) {
    const { rowCount } = await pool.query(
      `select 1 from conversions where telefone is not null and regexp_replace(telefone, '\\D', '', 'g') = $1 limit 1`,
      [digitsOnly(telefone)]
    )
    if (rowCount) {
      throw new Error('Esse telefone já tem uma conversão registrada pela Ane — não é possível cadastrar de novo aqui.')
    }
  }

  const academiaId = resolveAcademiaId(profile, requestedAcademiaId)

  await pool.query(
    'insert into clientes_alle (academia_id, nome, telefone, email, status) values ($1, $2, $3, $4, $5)',
    [academiaId, nome, telefone || null, email || null, status]
  )

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}

export async function updateClienteAlle(clienteId: string, formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar clientes Alle.')
  }

  const requestedAcademiaId = String(formData.get('academia_id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = String(formData.get('telefone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const status = parseStatus(formData.get('status'))

  if (!requestedAcademiaId || !nome) {
    throw new Error('Academia e nome são obrigatórios.')
  }

  const academiaId = resolveAcademiaId(profile, requestedAcademiaId)

  const { rowCount } = await pool.query(
    `update clientes_alle
     set academia_id = $1, nome = $2, telefone = $3, email = $4, status = $5, updated_at = now()
     where id = $6`,
    [academiaId, nome, telefone || null, email || null, status, clienteId]
  )
  if (rowCount === 0) {
    throw new Error('Cliente não encontrado.')
  }

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}

// Ação rápida de linha (junto de Editar/Excluir) pra reprovar/cancelar sem abrir o
// formulário inteiro — mesmo efeito de editar e trocar o status pra 'reprovado'.
export async function reprovarClienteAlle(clienteId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para reprovar clientes Alle.')
  }

  const { rowCount } = await pool.query(
    `update clientes_alle set status = 'reprovado', updated_at = now() where id = $1`,
    [clienteId]
  )
  if (rowCount === 0) {
    throw new Error('Cliente não encontrado.')
  }

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}

export async function deleteClienteAlle(clienteId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para excluir clientes Alle.')
  }

  const { rowCount } = await pool.query('delete from clientes_alle where id = $1', [clienteId])
  if (rowCount === 0) {
    throw new Error('Cliente não encontrado.')
  }

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}

export type ImportClientesAlleResult = {
  importados: number
  atualizados: number
  ignorados: number
  jaConvertidosAne: number
  academiasNaoEncontradas: string[]
}

// Upsert por (academia, nome) — mesma lógica de importAcademiasCsv (academias/actions.ts):
// reenviar uma lista atualizada corrige status/telefone/email de quem já existe em vez de
// duplicar, e nome novo vira registro novo. O nome da unidade no CSV passa pelo mesmo
// resolvedor tolerante a acento/hífen/alias do sync do Alle Documentos e do webhook do
// agregador (buildAcademiaNomeResolver) — é texto livre de fora, não bate sempre igual ao
// cadastro. Roles escopados (coordenador/gestor de uma unidade) só importam pra própria
// academia; linhas de outra unidade são ignoradas em vez de derrubar o lote inteiro.
//
// Linha com telefone que já apareceu numa conversão da Ane (conversions, vindo do
// Supabase/Alle Documentos) não entra — essa pessoa já está contada como convertida
// pelo pipeline automático, adicionar de novo aqui duplicaria a mesma pessoa entre
// as duas origens (ver o split Ane/manual explicado em /clientes-alle e no funil).
export async function importClientesAlleCsv(formData: FormData): Promise<ImportClientesAlleResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para importar clientes Alle.')
  }

  const file = formData.get('csv')
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Selecione um arquivo CSV.')
  }

  const text = await file.text()
  const rows = parseCsv(text)
  if (rows.length === 0) {
    throw new Error('Arquivo vazio.')
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase())
  const nomeIdx = header.indexOf('nome')
  const academiaIdx = header.indexOf('academia')
  const statusIdx = header.indexOf('status')
  const telefoneIdx = header.indexOf('telefone')
  const emailIdx = header.indexOf('email')

  if (nomeIdx === -1 || academiaIdx === -1) {
    throw new Error('Cabeçalho inválido — o CSV precisa das colunas "nome" e "academia".')
  }

  const [{ rows: academias }, { rows: aliases }, { rows: conversoesTelefones }] = await Promise.all([
    pool.query<{ id: string; nome: string }>('select id, nome from academias'),
    pool.query<{ alias_nome: string; academia_id: string }>('select alias_nome, academia_id from academia_aliases'),
    pool.query<{ telefone: string }>(`select telefone from conversions where telefone is not null and telefone != ''`),
  ])
  const resolveAcademiaIdByNome = buildAcademiaNomeResolver(academias, aliases)
  const telefonesConvertidosAne = new Set(conversoesTelefones.map((r) => digitsOnly(r.telefone)))

  const scopedAcademiaId = scopeAcademiaId(profile, null)

  let importados = 0
  let atualizados = 0
  let ignorados = 0
  let jaConvertidosAne = 0
  const academiasNaoEncontradas = new Set<string>()

  const client = await pool.connect()
  try {
    await client.query('begin')

    for (const cols of rows.slice(1)) {
      const nome = (cols[nomeIdx] ?? '').trim()
      const academiaNomeRaw = (cols[academiaIdx] ?? '').trim()
      const status: ClienteAlleStatus =
        statusIdx !== -1 && (cols[statusIdx] ?? '').trim().toLowerCase() === 'ativo' ? 'ativo' : 'pendente'
      const telefone = telefoneIdx !== -1 ? (cols[telefoneIdx] ?? '').trim() : ''
      const email = emailIdx !== -1 ? (cols[emailIdx] ?? '').trim() : ''

      if (!nome || !academiaNomeRaw) {
        ignorados++
        continue
      }

      const academiaId = resolveAcademiaIdByNome(academiaNomeRaw)
      if (!academiaId) {
        academiasNaoEncontradas.add(academiaNomeRaw)
        ignorados++
        continue
      }
      if (scopedAcademiaId && academiaId !== scopedAcademiaId) {
        ignorados++
        continue
      }

      if (telefone && telefonesConvertidosAne.has(digitsOnly(telefone))) {
        jaConvertidosAne++
        continue
      }

      const { rowCount } = await client.query(
        `update clientes_alle set status = $1, telefone = $2, email = $3, updated_at = now()
         where academia_id = $4 and lower(trim(nome)) = lower($5)`,
        [status, telefone || null, email || null, academiaId, nome]
      )

      if (rowCount) {
        atualizados++
      } else {
        await client.query(
          `insert into clientes_alle (academia_id, nome, telefone, email, status) values ($1, $2, $3, $4, $5)`,
          [academiaId, nome, telefone || null, email || null, status]
        )
        importados++
      }
    }

    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')

  return { importados, atualizados, ignorados, jaConvertidosAne, academiasNaoEncontradas: [...academiasNaoEncontradas] }
}

// Ações em massa (seleção múltipla na tabela) — mesmo guard das ações individuais
// acima. Sem checagem de escopo por academia: canManageManualData já é
// super_admin/gestor, e os dois sempre enxergam todas as academias
// (seesAllAcademias), então não existe cliente "de outra unidade" fora do alcance
// desses roles.
export async function bulkUpdateClientesAlleStatus(clienteIds: string[], status: ClienteAlleStatus) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar clientes Alle.')
  }
  if (clienteIds.length === 0) return

  await pool.query(`update clientes_alle set status = $1, updated_at = now() where id = any($2::uuid[])`, [
    status,
    clienteIds,
  ])

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}

export async function bulkDeleteClientesAlle(clienteIds: string[]) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para excluir clientes Alle.')
  }
  if (clienteIds.length === 0) return

  await pool.query(`delete from clientes_alle where id = any($1::uuid[])`, [clienteIds])

  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}
