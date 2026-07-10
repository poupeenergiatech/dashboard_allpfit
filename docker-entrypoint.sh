#!/bin/sh
set -e

# Aplica o schema mais recente antes de subir o servidor. Sem isso, um Postgres novo
# (ex.: primeiro deploy) fica sem as tabelas (users/sessions/academias/...) e o login
# falha com "relation \"users\" does not exist". Idempotente — scripts/migrate.mjs só
# aplica as migrations que ainda não rodaram (tabela schema_migrations).
node scripts/migrate.mjs

exec node server.js
