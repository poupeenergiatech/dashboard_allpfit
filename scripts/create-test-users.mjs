// Sprint 2 — S2-14: cria um usuário de teste para cada role (super_admin, gestor,
// coordenador, visualizador) e o respectivo user_profiles.
//
// Requer as tabelas já migradas e pelo menos uma academia cadastrada
// (rode supabase/seed/academias.sql antes).
//
// Uso:
//   node --env-file=.env.local scripts/create-test-users.mjs
//
// Necessário no .env.local: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// (a service role key nunca deve rodar no browser — só aqui, em script local).

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. Rode com --env-file=.env.local.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_PASSWORD = 'TesteAllpFit#2026'

const USERS = [
  { role: 'super_admin', email: 'teste.superadmin@allpfit.dev', scoped: false },
  { role: 'gestor', email: 'teste.gestor@allpfit.dev', scoped: false },
  { role: 'coordenador', email: 'teste.coordenador@allpfit.dev', scoped: true },
  { role: 'visualizador', email: 'teste.visualizador@allpfit.dev', scoped: true },
]

async function main() {
  const { data: academias, error: academiasError } = await supabase
    .from('academias')
    .select('id, nome')
    .order('nome')
    .limit(1)

  if (academiasError) throw academiasError
  if (!academias?.length) {
    console.error(
      'Nenhuma academia encontrada. Rode supabase/seed/academias.sql antes de criar os usuários de teste.'
    )
    process.exit(1)
  }

  const testAcademiaId = academias[0].id
  console.log(`Usuários "coordenador" e "visualizador" de teste serão vinculados a: ${academias[0].nome}`)

  for (const user of USERS) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    if (createError && !createError.message.includes('already been registered')) {
      throw createError
    }

    const userId =
      created?.user?.id ??
      (await supabase.auth.admin.listUsers()).data.users.find((u) => u.email === user.email)?.id

    if (!userId) {
      console.error(`Não foi possível resolver o user_id de ${user.email}`)
      continue
    }

    const { error: profileError } = await supabase.from('user_profiles').upsert({
      user_id: userId,
      role: user.role,
      academia_id: user.scoped ? testAcademiaId : null,
    })

    if (profileError) throw profileError

    console.log(`✓ ${user.role.padEnd(12)} ${user.email}`)
  }

  console.log(`\nSenha de todos os usuários de teste: ${TEST_PASSWORD}`)
  console.log('Apague esses usuários antes de ir para produção (Sprint 5, S5-10).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
