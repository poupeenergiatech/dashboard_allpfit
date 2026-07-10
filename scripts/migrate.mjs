// Aplica os arquivos de db/migrations/ em ordem numérica, pulando os que já foram
// aplicados (controlados pela tabela schema_migrations). Substitui o antigo
// `supabase db push`.
//
// Uso:
//   node --env-file=.env.local scripts/migrate.mjs
//
// Necessário no .env.local: DATABASE_URL

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Falta DATABASE_URL. Rode com --env-file=.env.local.')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations')

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const client = new pg.Client({ connectionString: DATABASE_URL })

async function main() {
  await client.connect()

  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  const { rows: applied } = await client.query('select name from schema_migrations')
  const appliedNames = new Set(applied.map((r) => r.name))

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`- ${file} (já aplicada)`)
      continue
    }

    const sql = readFileSync(path.join(migrationsDir, file), 'utf8')

    await client.query('begin')
    try {
      await client.query(sql)
      await client.query('insert into schema_migrations (name) values ($1)', [file])
      await client.query('commit')
      console.log(`✓ ${file}`)
    } catch (err) {
      await client.query('rollback')
      throw new Error(`Falha aplicando ${file}: ${err.message}`)
    }
  }

  console.log('\nSchema atualizado.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => client.end())
