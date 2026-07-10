import { Pool, types } from 'pg'

// count(*) e outras agregações retornam bigint (OID 20) — o driver por padrão devolve
// como string pra não perder precisão acima de 2^53. Os volumes deste app (contatos,
// conversões etc.) nunca chegam perto disso, então convertemos direto pra number aqui
// uma vez, em vez de fazer Number(...) espalhado em cada query.
types.setTypeParser(20, (value) => parseInt(value, 10))

// `date` (OID 1082) por padrão vira um JS Date (meia-noite UTC), o que causa bug de
// fuso quando exibido em horário local (vira o dia anterior). Mantemos como string
// "YYYY-MM-DD" pura, igual ao que o PostgREST/supabase-js já devolvia antes.
types.setTypeParser(1082, (value) => value)

// Singleton via globalThis para não recriar o pool a cada hot-reload em dev (mesmo
// problema clássico do Prisma/pg em Next.js dev mode — sem isso, cada reload abriria
// novas conexões até esgotar o limite do Postgres).
const globalForPool = globalThis as unknown as { pgPool?: Pool }

export const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPool.pgPool = pool
}
