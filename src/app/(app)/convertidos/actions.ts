'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db/pool'
import { canManageManualData, getCurrentUserProfile } from '@/lib/auth/profile'

// Só existe pra convertidos "sem unidade" (conversions.academia_id null) — uma vez
// que o sync já insere com `on conflict (alle_documento_id) do nothing`, corrigir a
// origem no Alle Documentos e sincronizar de novo NÃO atualiza esse registro (o
// conflito já existe, o "do nothing" barra até a correção). Esse form é o único
// jeito de vincular a academia certa depois do fato — por isso a query também exige
// `academia_id is null`: convertido que já veio resolvido pelo sync não é pra
// editar manualmente aqui.
export async function updateClienteConvertidoAcademia(conversionId: string, formData: FormData) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar clientes convertidos.')
  }

  const academiaId = String(formData.get('academia_id') ?? '')
  const nome = String(formData.get('nome') ?? '').trim()
  const telefone = String(formData.get('telefone') ?? '').trim()

  if (!academiaId) {
    throw new Error('Academia é obrigatória.')
  }

  const { rowCount } = await pool.query(
    `update conversions
     set academia_id = $1, nome = $2, telefone = $3
     where id = $4 and academia_id is null`,
    [academiaId, nome || null, telefone || null, conversionId]
  )
  if (rowCount === 0) {
    throw new Error('Convertido não encontrado ou já tem academia vinculada.')
  }

  revalidatePath('/convertidos')
  revalidatePath('/')
  revalidatePath('/performance')
}

// Confirma que o convertido assinou o termo de adesão e vira cliente Alle ativo —
// cria (ou reaproveita, se já existir por academia+nome, mesmo upsert do CSV de
// clientes_alle) o registro em clientes_alle com status 'ativo', e grava o vínculo
// em conversions.cliente_alle_id pra não deixar promover a mesma pessoa duas vezes.
// Exige academia definida (não dá pra criar um cliente Alle sem academia) e nome
// preenchido — resolve isso primeiro via updateClienteConvertidoAcademia acima.
export async function promoverClienteConvertido(conversionId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para promover clientes convertidos.')
  }

  const { rows } = await pool.query<{
    academia_id: string | null
    nome: string | null
    telefone: string | null
    cliente_alle_id: string | null
  }>('select academia_id, nome, telefone, cliente_alle_id from conversions where id = $1', [conversionId])

  const conversion = rows[0]
  if (!conversion) {
    throw new Error('Convertido não encontrado.')
  }
  if (conversion.cliente_alle_id) {
    throw new Error('Esse convertido já foi marcado como cliente Alle ativo.')
  }
  if (!conversion.academia_id) {
    throw new Error('Defina a academia antes de marcar como assinado.')
  }
  if (!conversion.nome) {
    throw new Error('Esse convertido não tem nome cadastrado — edite antes de marcar como assinado.')
  }

  const client = await pool.connect()
  try {
    await client.query('begin')

    const { rows: existing } = await client.query<{ id: string }>(
      `select id from clientes_alle where academia_id = $1 and lower(trim(nome)) = lower($2) limit 1`,
      [conversion.academia_id, conversion.nome]
    )

    let clienteAlleId: string
    if (existing[0]) {
      clienteAlleId = existing[0].id
      await client.query(
        `update clientes_alle set status = 'ativo', telefone = coalesce($1, telefone), updated_at = now() where id = $2`,
        [conversion.telefone, clienteAlleId]
      )
    } else {
      const { rows: inserted } = await client.query<{ id: string }>(
        `insert into clientes_alle (academia_id, nome, telefone, status) values ($1, $2, $3, 'ativo') returning id`,
        [conversion.academia_id, conversion.nome, conversion.telefone]
      )
      clienteAlleId = inserted[0].id
    }

    await client.query('update conversions set cliente_alle_id = $1 where id = $2', [clienteAlleId, conversionId])

    await client.query('commit')
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }

  revalidatePath('/convertidos')
  revalidatePath('/clientes-alle')
  revalidatePath('/')
  revalidatePath('/pendentes')
}
