import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type NumeroStatus = {
  academiaId: string
  nome: string
  numeroTelefone: string | null
  ativo: boolean
  mensagensHoje: number
}

// PREMISSA A VALIDAR: "status online/offline" (S4-06) idealmente viria do agregador em
// tempo real, mas não temos esse dado modelado ainda — usamos `academias.ativo` como
// proxy até o agregador expor um status real por número.
export async function fetchNumeros(profile: UserProfile): Promise<NumeroStatus[]> {
  const scopedAcademiaId = seesAllAcademias(profile.role) ? null : profile.academiaId

  // Calculado em JS (fuso do processo Node), não com now()/date_trunc do Postgres, pra
  // não depender do timezone configurado no servidor de banco.
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { rows } = await pool.query<{
    academia_id: string
    nome: string
    numero_telefone: string | null
    ativo: boolean
    mensagens_hoje: number
  }>(
    `select
       a.id as academia_id,
       a.nome,
       a.numero_telefone,
       a.ativo,
       count(c.id) filter (where c.created_at >= $2) as mensagens_hoje
     from academias a
     left join contacts c on c.academia_id = a.id
     where ($1::uuid is null or a.id = $1)
     group by a.id
     order by a.nome`,
    [scopedAcademiaId, todayStart.toISOString()]
  )

  return rows.map((row) => ({
    academiaId: row.academia_id,
    nome: row.nome,
    numeroTelefone: row.numero_telefone,
    ativo: row.ativo,
    mensagensHoje: row.mensagens_hoje,
  }))
}
