import { pool } from '@/lib/db/pool'
import { scopeAcademiaId, type UserProfile } from '@/lib/auth/profile'

export type ClienteConvertidoOrigem = 'ane' | 'manual'

export type ClienteConvertido = {
  id: string
  origem: ClienteConvertidoOrigem
  academiaId: string | null
  academiaNome: string | null
  nome: string | null
  telefone: string | null
  status: 'ativo' | 'pendente' | 'reprovado' | 'sem_informacao' | null
  createdAt: string
}

// União de duas origens de conversão: automática (conversions, sync do Alle
// Documentos — ver sync-alle-documentos.ts) e manual/Bitrix (clientes_alle,
// cadastro individual ou CSV em /clientes-alle) — as duas são gente que converteu,
// só que por canais diferentes, e por isso aparecem juntas aqui. Sem duplicar: quem
// entra em clientes_alle já passa pela checagem de telefone contra conversions (ver
// createClienteAlle/importClientesAlleCsv em clientes-alle/actions.ts) antes de ser
// aceito, então o mesmo telefone nunca teria uma linha nos dois lados da união — exceto
// quando o vínculo é feito aqui mesmo (definirStatusClienteConvertido cria o
// clientes_alle a partir do 'ane'): esse registro novo já É a mesma pessoa da linha
// 'ane' vinculada, por isso o lado 'manual' abaixo exclui qualquer clientes_alle
// referenciado por conversions.cliente_alle_id — sem o "not exists", a pessoa
// apareceria duas vezes (uma vez por origem) depois de vinculada.
//
// status vem null só pra linhas 'ane' ainda sem decisão (nem vinculadas a um
// clientes_alle, nem reprovadas) — é o que a tabela usa pra decidir entre mostrar os
// botões de ação (status null + academia definida) ou o badge/seletor de status
// (sempre o caso das linhas 'manual', que já SÃO um registro de clientes_alle).
// Depois de vinculada (cliente_alle_id preenchido, ver definirStatusClienteConvertido
// em convertidos/actions.ts), o status vem do clientes_alle vinculado — ativo,
// pendente ou sem_informacao, o que estiver lá agora, não um valor fixo — editar esse
// cliente em /clientes-alle depois de vinculado reflete aqui também. 'reprovado' do
// lado 'ane' (antes de vincular) vem de conversions.status (coluna própria — ver
// migration 0020) em vez de um clientes_alle: reprovar não devia depender de
// academia/nome estarem preenchidos, que é o caso de sem-unidade.
//
// academiaId/academiaNome vêm null só do lado 'ane' — clientes_alle.academia_id é
// not null no schema, então 'manual' nunca cai nesse caso. Só aparece pra quem
// enxerga todas as academias: scopeAcademiaId sempre resolve pra uma academia real
// quando o role é escopado, então esses registros null nunca entram no filtro dele.
export async function fetchClientesConvertidos(
  profile: UserProfile,
  requestedAcademiaId?: string | null
): Promise<ClienteConvertido[]> {
  const scopedAcademiaId = scopeAcademiaId(profile, requestedAcademiaId ?? null)

  const { rows } = await pool.query<{
    id: string
    origem: ClienteConvertidoOrigem
    academia_id: string | null
    academia_nome: string | null
    nome: string | null
    telefone: string | null
    status: 'ativo' | 'pendente' | 'reprovado' | 'sem_informacao' | null
    created_at: string
  }>(
    `select c.id, 'ane' as origem, c.academia_id, a.nome as academia_nome, c.nome, c.telefone,
            case
              when c.cliente_alle_id is not null then linked.status
              when c.status = 'reprovado' then 'reprovado'
              else null
            end as status,
            c.created_at
     from conversions c
     left join academias a on a.id = c.academia_id
     left join clientes_alle linked on linked.id = c.cliente_alle_id
     where ($1::uuid is null or c.academia_id = $1)
     union all
     select ca.id, 'manual' as origem, ca.academia_id, a.nome as academia_nome, ca.nome, ca.telefone,
            ca.status, ca.created_at
     from clientes_alle ca
     join academias a on a.id = ca.academia_id
     where ($1::uuid is null or ca.academia_id = $1)
       and not exists (select 1 from conversions c2 where c2.cliente_alle_id = ca.id)
     order by created_at desc`,
    [scopedAcademiaId]
  )

  return rows.map((row) => ({
    id: row.id,
    origem: row.origem,
    academiaId: row.academia_id,
    academiaNome: row.academia_nome,
    nome: row.nome,
    telefone: row.telefone,
    status: row.status,
    createdAt: row.created_at,
  }))
}
