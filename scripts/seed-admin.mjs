// Cria (ou promove a super_admin) o primeiro usuário do sistema — resolve o problema de
// "ovo e galinha": convidar usuários só é possível de dentro do dashboard, logado como
// Super Admin, mas sem nenhum usuário ainda não tem como logar.
//
// Requer as tabelas já migradas (ver supabase/README.md).
//
// Uso:
//   SEED_ADMIN_EMAIL=voce@dominio.com node --env-file=.env.local scripts/seed-admin.mjs
//
// Opcional: SEED_ADMIN_PASSWORD — se omitida, uma senha aleatória é gerada e impressa uma
// única vez (guarde na hora, não fica salva em nenhum lugar).
//
// Necessário no .env.local: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// (a service role key nunca deve rodar no browser — só aqui, em script local).

import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. Rode com --env-file=.env.local.'
  )
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  // Já existe: só garante a role, não mexe na senha de quem já tinha conta.
  const alreadyExisted = createError?.message?.includes('already been registered') ?? false
  if (createError && !alreadyExisted) {
    throw createError
  }

  const userId =
    created?.user?.id ?? (await supabase.auth.admin.listUsers()).data.users.find((u) => u.email === email)?.id

  if (!userId) {
    console.error(`Não foi possível resolver o user_id de ${email}`)
    process.exit(1)
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, role: 'super_admin', academia_id: null })

  if (profileError) throw profileError

  console.log(`✓ super_admin: ${email}`)

  if (alreadyExisted) {
    console.log('\nUsuário já existia — role garantida como super_admin, senha não foi alterada.')
  } else if (explicitPassword) {
    console.log('\nSenha definida via SEED_ADMIN_PASSWORD.')
  } else {
    console.log(`\nSenha gerada (guarde agora, não será mostrada de novo): ${password}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
