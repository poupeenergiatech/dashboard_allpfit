// Sprint 2 — S2-14: cria um usuário de teste para cada role (super_admin, gestor,
// coordenador, visualizador) e o respectivo user_profiles.
//
// Requer o schema já migrado e pelo menos uma academia cadastrada
// (rode db/seed/academias.sql antes).
//
// Uso:
//   node --env-file=.env.local scripts/create-test-users.mjs
//
// Necessário no .env.local: DATABASE_URL

import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import pg from 'pg'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

// Duplicado de src/lib/auth/password.ts — ver nota em scripts/seed-admin.mjs.
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH)
  return `${salt}:${derivedKey.toString('hex')}`
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Falta DATABASE_URL. Rode com --env-file=.env.local.')
  process.exit(1)
}

const TEST_PASSWORD = 'TesteAllpFit#2026'

const USERS = [
  { role: 'super_admin', email: 'teste.superadmin@allpfit.dev', scoped: false },
  { role: 'gestor', email: 'teste.gestor@allpfit.dev', scoped: false },
  { role: 'coordenador', email: 'teste.coordenador@allpfit.dev', scoped: true },
  { role: 'visualizador', email: 'teste.visualizador@allpfit.dev', scoped: true },
]

const client = new pg.Client({ connectionString: DATABASE_URL })

async function main() {
  await client.connect()

  const { rows: academias } = await client.query('select id, nome from academias order by nome limit 1')
  if (!academias.length) {
    console.error(
      'Nenhuma academia encontrada. Rode db/seed/academias.sql antes de criar os usuários de teste.'
    )
    process.exit(1)
  }

  const testAcademiaId = academias[0].id
  console.log(`Usuários "coordenador" e "visualizador" de teste serão vinculados a: ${academias[0].nome}`)

  const passwordHash = await hashPassword(TEST_PASSWORD)

  for (const user of USERS) {
    const { rows: existing } = await client.query('select id from users where email = $1', [user.email])
    let userId = existing[0]?.id

    if (!userId) {
      const { rows } = await client.query(
        'insert into users (email, password_hash) values ($1, $2) returning id',
        [user.email, passwordHash]
      )
      userId = rows[0].id
    }

    await client.query(
      `insert into user_profiles (user_id, role, academia_id) values ($1, $2, $3)
       on conflict (user_id) do update set role = $2, academia_id = $3`,
      [userId, user.role, user.scoped ? testAcademiaId : null]
    )

    console.log(`✓ ${user.role.padEnd(12)} ${user.email}`)
  }

  console.log(`\nSenha de todos os usuários de teste: ${TEST_PASSWORD}`)
  console.log('Apague esses usuários antes de ir para produção (Sprint 5, S5-10).')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => client.end())
