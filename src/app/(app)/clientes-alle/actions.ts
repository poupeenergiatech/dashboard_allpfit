'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageManualData, getCurrentUserProfile, scopeAcademiaId } from '@/lib/auth/profile'

// Mesmo guard/escopo de manual_data (performance/actions.ts): clientes_alle é outro
// cadastro manual por academia, sem sincronização automática — mesmo nível de
// permissão faz sentido (super_admin/gestor).
function resolveAcademiaId(profile: Awaited<ReturnType<typeof getCurrentUserProfile>>, requestedAcademiaId: string) {
  if (!profile) throw new Error('Sem sessão válida.')
  const academiaId = scopeAcademiaId(profile, requestedAcademiaId)
  if (academiaId !== requestedAcademiaId) {
    throw new Error('Sem permissão para editar clientes de outra academia.')
  }
  return academiaId
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

  if (!requestedAcademiaId || !nome) {
    throw new Error('Academia e nome são obrigatórios.')
  }

  const academiaId = resolveAcademiaId(profile, requestedAcademiaId)

  await pool.query(
    'insert into clientes_alle (academia_id, nome, telefone, email) values ($1, $2, $3, $4)',
    [academiaId, nome, telefone || null, email || null]
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
  const ativo = formData.get('ativo') === 'on'

  if (!requestedAcademiaId || !nome) {
    throw new Error('Academia e nome são obrigatórios.')
  }

  const academiaId = resolveAcademiaId(profile, requestedAcademiaId)

  const { rowCount } = await pool.query(
    `update clientes_alle
     set academia_id = $1, nome = $2, telefone = $3, email = $4, ativo = $5, updated_at = now()
     where id = $6`,
    [academiaId, nome, telefone || null, email || null, ativo, clienteId]
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
