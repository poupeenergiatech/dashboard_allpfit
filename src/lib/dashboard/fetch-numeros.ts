import { pool } from '@/lib/db/pool'
import { seesAllAcademias, type UserProfile } from '@/lib/auth/profile'

export type NumeroGroup = {
  numeroTelefone: string | null
  ativo: boolean
  mensagensHoje: number
  unidades: { academiaId: string; nome: string }[]
}

// PREMISSA A VALIDAR: "status online/offline" (S4-06) idealmente viria do agregador em
// tempo real, mas não temos esse dado modelado ainda — usamos `academias.ativo` como
// proxy até o agregador expor um status real por número.
export async function fetchNumeros(profile: UserProfile): Promise<NumeroGroup[]> {
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

  // Agrupa por número — várias unidades podem compartilhar a mesma instância
  // WhatsApp do agregador. Unidades sem número configurado não são agrupadas entre
  // si (cada uma vira seu próprio grupo de 1), pra não esconder quem falta configurar.
  const groups = new Map<string, NumeroGroup>()

  for (const row of rows) {
    const key = row.numero_telefone ?? `__sem-numero:${row.academia_id}`
    const existing = groups.get(key)

    if (existing) {
      existing.mensagensHoje += row.mensagens_hoje
      existing.ativo = existing.ativo || row.ativo
      existing.unidades.push({ academiaId: row.academia_id, nome: row.nome })
    } else {
      groups.set(key, {
        numeroTelefone: row.numero_telefone,
        ativo: row.ativo,
        mensagensHoje: row.mensagens_hoje,
        unidades: [{ academiaId: row.academia_id, nome: row.nome }],
      })
    }
  }

  // Números com mais unidades vinculadas primeiro (é o que mais interessa checar);
  // sem número configurado sempre por último.
  return [...groups.values()].sort((a, b) => {
    if (!a.numeroTelefone && !b.numeroTelefone) return 0
    if (!a.numeroTelefone) return 1
    if (!b.numeroTelefone) return -1
    if (b.unidades.length !== a.unidades.length) return b.unidades.length - a.unidades.length
    return a.numeroTelefone.localeCompare(b.numeroTelefone)
  })
}
