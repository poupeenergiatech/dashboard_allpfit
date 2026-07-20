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
  return value === 'pendente' ? 'pendente' : 'ativo'
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

  const academiaId = resolveAcademiaId(profile, requestedAcademiaId)

  await pool.query(
    'insert into clientes_alle (academia_id, nome, telefone, email, status) values ($1, $2, $3, $4, $5)',
    [academiaId, nome, telefone || null, email || null, status]
  )

  revalidatePath('/clientes-alle')
  revalidatePath('/')
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
}

export type ImportClientesAlleResult = {
  importados: number
  atualizados: number
  ignorados: number
  academiasNaoEncontradas: string[]
}

// Upsert por (academia, nome) — mesma lógica de importAcademiasCsv (academias/actions.ts):
// reenviar uma lista atualizada corrige status/telefone/email de quem já existe em vez de
// duplicar, e nome novo vira registro novo. O nome da unidade no CSV passa pelo mesmo
// resolvedor tolerante a acento/hífen/alias do sync do Alle Documentos e do webhook do
// agregador (buildAcademiaNomeResolver) — é texto livre de fora, não bate sempre igual ao
// cadastro. Roles escopados (coordenador/gestor de uma unidade) só importam pra própria
// academia; linhas de outra unidade são ignoradas em vez de derrubar o lote inteiro.
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

  const [{ rows: academias }, { rows: aliases }] = await Promise.all([
    pool.query<{ id: string; nome: string }>('select id, nome from academias'),
    pool.query<{ alias_nome: string; academia_id: string }>('select alias_nome, academia_id from academia_aliases'),
  ])
  const resolveAcademiaIdByNome = buildAcademiaNomeResolver(academias, aliases)

  const scopedAcademiaId = scopeAcademiaId(profile, null)

  let importados = 0
  let atualizados = 0
  let ignorados = 0
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

  return { importados, atualizados, ignorados, academiasNaoEncontradas: [...academiasNaoEncontradas] }
}
