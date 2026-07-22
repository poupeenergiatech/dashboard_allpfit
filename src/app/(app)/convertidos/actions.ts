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

export type ClienteConvertidoStatusEditavel = 'ativo' | 'pendente' | 'sem_informacao'

// Marca o termo de adesão do convertido (Ativo/Pendente de assinatura/Sem
// informação — igual o status de clientes_alle, ver ClienteAlleStatus) — cria (ou
// reaproveita, se já existir por academia+nome, mesmo upsert do CSV de
// clientes_alle) o registro em clientes_alle com esse status, e grava o vínculo em
// conversions.cliente_alle_id pra não deixar fazer isso duas vezes pra mesma
// conversão. Exige academia definida (não dá pra criar um cliente Alle sem
// academia) e nome preenchido — resolve isso primeiro via
// updateClienteConvertidoAcademia acima. Reprovado fica de fora de propósito: usa
// reprovarClienteConvertido abaixo, que não depende de academia/nome preenchidos.
// Depois de vinculado, mudar o status de novo é em /clientes-alle — esse registro
// já existe lá com vida própria.
export async function definirStatusClienteConvertido(
  conversionId: string,
  status: ClienteConvertidoStatusEditavel
) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar clientes convertidos.')
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
    throw new Error('Esse convertido já foi marcado como cliente Alle — edite o status em Clientes Alle.')
  }
  if (!conversion.academia_id) {
    throw new Error('Defina a academia antes de marcar o termo de adesão.')
  }
  if (!conversion.nome) {
    throw new Error('Esse convertido não tem nome cadastrado — edite antes de marcar o termo de adesão.')
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
        `update clientes_alle set status = $1, telefone = coalesce($2, telefone), updated_at = now() where id = $3`,
        [status, conversion.telefone, clienteAlleId]
      )
    } else {
      const { rows: inserted } = await client.query<{ id: string }>(
        `insert into clientes_alle (academia_id, nome, telefone, status) values ($1, $2, $3, $4) returning id`,
        [conversion.academia_id, conversion.nome, conversion.telefone, status]
      )
      clienteAlleId = inserted[0].id
    }

    await client.query(
      `update conversions set cliente_alle_id = $1, status = null where id = $2`,
      [clienteAlleId, conversionId]
    )

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

// Reprova/cancela um convertido da Ane sem precisar dele ter academia ou nome
// preenchidos (diferente de promoverClienteConvertido, que precisa dos dois pra
// criar o cliente Alle) — por isso é uma coluna própria em conversions em vez de
// um registro em clientes_alle (ver migration 0020). Só bloqueia quem já foi
// promovido a cliente Alle ativo; reprovar depois de reprovado (ou antes de nunca
// ter sido) é sempre idempotente.
export async function reprovarClienteConvertido(conversionId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para reprovar clientes convertidos.')
  }

  const { rows } = await pool.query<{ cliente_alle_id: string | null }>(
    'select cliente_alle_id from conversions where id = $1',
    [conversionId]
  )
  const conversion = rows[0]
  if (!conversion) {
    throw new Error('Convertido não encontrado.')
  }
  if (conversion.cliente_alle_id) {
    throw new Error('Esse convertido já foi marcado como cliente Alle ativo.')
  }

  await pool.query(`update conversions set status = 'reprovado' where id = $1`, [conversionId])

  revalidatePath('/convertidos')
  revalidatePath('/')
}

// Desfaz uma reprovação (volta pro estado "sem decisão", disponível de novo pra
// promover ou reprovar) — sem isso, reprovar por engano não teria como voltar
// atrás na UI.
export async function desfazerReprovacaoClienteConvertido(conversionId: string) {
  const profile = await getCurrentUserProfile()
  if (!profile || !canManageManualData(profile.role)) {
    throw new Error('Sem permissão para editar clientes convertidos.')
  }

  await pool.query(`update conversions set status = null where id = $1`, [conversionId])

  revalidatePath('/convertidos')
  revalidatePath('/')
}
