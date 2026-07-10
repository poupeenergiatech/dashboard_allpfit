// Cria (ou promove a super_admin) o primeiro usuário do sistema — resolve o problema de
// "ovo e galinha": criar usuários só é possível de dentro do dashboard, logado como
// Super Admin, mas sem nenhum usuário ainda não tem como logar.
//
// Requer o schema já migrado (node --env-file=.env.local scripts/migrate.mjs).
//
// Uso:
//   SEED_ADMIN_EMAIL=voce@dominio.com node --env-file=.env.local scripts/seed-admin.mjs
//
// Opcional: SEED_ADMIN_PASSWORD — se omitida, uma senha aleatória é gerada e impressa uma
// única vez (guarde na hora, não fica salva em nenhum lugar).
//
// Necessário no .env.local: DATABASE_URL

import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import pg from 'pg'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

// Duplicado de src/lib/auth/password.ts — esse arquivo é TypeScript e não roda em
// `node` puro sem build step; ~15 linhas estáveis, mais simples que adicionar
// tsx/ts-node como dependência só pra isso.
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

const email = process.env.SEED_ADMIN_EMAIL
if (!email) {
  console.error(
    'Defina SEED_ADMIN_EMAIL com o email do primeiro Super Admin, ex.:\n' +
      "  SEED_ADMIN_EMAIL=voce@dominio.com node --env-file=.env.local scripts/seed-admin.mjs"
  )
  process.exit(1)
}

const explicitPassword = process.env.SEED_ADMIN_PASSWORD
const password = explicitPassword ?? randomBytes(12).toString('base64url')

const client = new pg.Client({ connectionString: DATABASE_URL })

async function main() {
  await client.connect()

  const { rows: existing } = await client.query('select id from users where email = $1', [email])
  const alreadyExisted = existing.length > 0
  let userId = existing[0]?.id

  if (!userId) {
    const passwordHash = await hashPassword(password)
    const { rows } = await client.query(
      'insert into users (email, password_hash) values ($1, $2) returning id',
      [email, passwordHash]
    )
    userId = rows[0].id
  }

  // Já existe: só garante a role, não mexe na senha de quem já tinha conta.
  await client.query(
    `insert into user_profiles (user_id, role, academia_id) values ($1, 'super_admin', null)
     on conflict (user_id) do update set role = 'super_admin', academia_id = null`,
    [userId]
  )

  console.log(`✓ super_admin: ${email}`)

  if (alreadyExisted) {
    console.log('\nUsuário já existia — role garantida como super_admin, senha não foi alterada.')
  } else if (explicitPassword) {
    console.log('\nSenha definida via SEED_ADMIN_PASSWORD.')
  } else {
    console.log(`\nSenha gerada (guarde agora, não será mostrada de novo): ${password}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => client.end())
