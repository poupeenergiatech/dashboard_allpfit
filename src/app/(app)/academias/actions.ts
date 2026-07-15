'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageUsers, getCurrentUserProfile } from '@/lib/auth/profile'
import { parseCsv } from '@/lib/dashboard/csv'

export async function createAcademia(formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode cadastrar academias.')
  }

  const nome = String(formData.get('nome') ?? '').trim()
  const numeroTelefone = String(formData.get('numero_telefone') ?? '').trim()
  const totalAlunos = Number(formData.get('total_alunos') ?? 0)

  if (!nome) {
    throw new Error('Nome é obrigatório.')
  }

  await pool.query('insert into academias (nome, numero_telefone, ativo, total_alunos) values ($1, $2, true, $3)', [
    nome,
    numeroTelefone || null,
    totalAlunos,
  ])

  revalidatePath('/academias')
  revalidatePath('/')
}

// Desativar preserva o histórico (contacts/conversions/manual_data já lançados
// continuam apontando pra essa academia) e some dela dos dropdowns/abas —
// fetchActiveAcademias só lista `ativo = true`. Preferível a excluir sempre que a
// unidade já tiver movimento.
export async function setAcademiaActive(academiaId: string, ativo: boolean) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode ativar/desativar academias.')
  }

  await pool.query('update academias set ativo = $1 where id = $2', [ativo, academiaId])

  revalidatePath('/academias')
  revalidatePath('/')
}

export async function updateAcademia(academiaId: string, formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode editar academias.')
  }

  const nome = String(formData.get('nome') ?? '').trim()
  const numeroTelefone = String(formData.get('numero_telefone') ?? '').trim()
  const totalAlunos = Number(formData.get('total_alunos') ?? 0)

  if (!nome) {
    throw new Error('Nome é obrigatório.')
  }

  await pool.query('update academias set nome = $1, numero_telefone = $2, total_alunos = $3 where id = $4', [
    nome,
    numeroTelefone || null,
    totalAlunos,
    academiaId,
  ])

  revalidatePath('/academias')
  revalidatePath('/')
}

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === '23503'
}

// Exclusão de verdade — só pra academia cadastrada por engano (duplicata, teste),
// sem nenhum histórico ainda. Qualquer referência existente (contacts, conversions,
// manual_data, user_profiles...) bloqueia via FK; nesse caso orientamos a desativar
// em vez de excluir, que é o caminho que preserva o histórico.
export async function deleteAcademia(academiaId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode excluir academias.')
  }

  try {
    const { rowCount } = await pool.query('delete from academias where id = $1', [academiaId])
    if (rowCount === 0) {
      throw new Error('Academia não encontrada.')
    }
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw new Error(
        'Essa academia já tem histórico vinculado (contatos, conversões, lançamentos...) e não pode ser excluída. Desative em vez de excluir.'
      )
    }
    throw err
  }

  revalidatePath('/academias')
  revalidatePath('/')
}

// Nome alternativo vindo de um sistema externo (hoje só Alle Documentos) que não
// bate com academias.nome mesmo normalizado — ex.: "João Pessoa" sem sufixo de
// estado enquanto a academia está cadastrada como "João Pessoa - PB". Usado pra
// resolver os itens de `naoEncontradas` do sync sem precisar renomear a academia.
export async function createAcademiaAlias(academiaId: string, aliasNome: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode vincular nomes alternativos.')
  }

  const nome = aliasNome.trim()
  if (!nome) {
    throw new Error('Nome é obrigatório.')
  }

  await pool.query(
    `insert into academia_aliases (academia_id, alias_nome)
     values ($1, $2)
     on conflict (lower(trim(alias_nome))) do update set academia_id = excluded.academia_id`,
    [academiaId, nome]
  )

  revalidatePath('/academias')
  revalidatePath('/configuracoes')
}

export async function deleteAcademiaAlias(aliasId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode remover nomes alternativos.')
  }

  await pool.query('delete from academia_aliases where id = $1', [aliasId])

  revalidatePath('/academias')
  revalidatePath('/configuracoes')
}

export type ImportAcademiasResult = { criadas: number; atualizadas: number; ignoradas: number }

// Upsert por nome (case-insensitive): uma unidade que já existe tem o número
// atualizado (permite reenviar o CSV pra corrigir um número errado); nome novo vira
// linha nova. Não há delete — uma unidade que sai do CSV simplesmente não é tocada.
export async function importAcademiasCsv(formData: FormData): Promise<ImportAcademiasResult> {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageUsers(profile.role)) {
    throw new Error('Apenas Super Admin pode importar academias.')
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
  const nomeIdx = header.indexOf('nome_academia')
  const numeroIdx = header.indexOf('numero_whatsapp')

  if (nomeIdx === -1 || numeroIdx === -1) {
    throw new Error('Cabeçalho inválido — o CSV precisa das colunas "nome_academia" e "numero_whatsapp".')
  }

  let criadas = 0
  let atualizadas = 0
  let ignoradas = 0

  const client = await pool.connect()
  try {
    await client.query('begin')

    for (const cols of rows.slice(1)) {
      const nome = (cols[nomeIdx] ?? '').trim()
      const numeroTelefone = (cols[numeroIdx] ?? '').trim()

      if (!nome) {
        ignoradas++
        continue
      }

      const { rowCount } = await client.query(
        'update academias set numero_telefone = $2, ativo = true where lower(trim(nome)) = lower($1)',
        [nome, numeroTelefone || null]
      )

      if (rowCount === 0) {
        await client.query('insert into academias (nome, numero_telefone, ativo) values ($1, $2, true)', [
          nome,
          numeroTelefone || null,
        ])
        criadas++
      } else {
        atualizadas++
      }
    }

    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  revalidatePath('/academias')
  revalidatePath('/')

  return { criadas, atualizadas, ignoradas }
}
