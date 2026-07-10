# Banco de dados — Postgres próprio

Substitui o antigo projeto Supabase. Migrations em `migrations/` (ordem numérica), seed
manual em `seed/`.

## Como aplicar

Requer só `DATABASE_URL` no `.env.local` (ou nas env vars do serviço em produção):

```bash
node --env-file=.env.local scripts/migrate.mjs
```

Aplica todos os arquivos de `migrations/` que ainda não rodaram (controlado pela tabela
`schema_migrations`). Idempotente — pode rodar de novo sem efeito colateral.

## Depois de aplicar

1. Rodar `db/seed/academias.sql` com a lista real das unidades (nome + número de WhatsApp):
   ```bash
   psql "$DATABASE_URL" -f db/seed/academias.sql
   ```
2. Criar o primeiro Super Admin (só assim dá pra logar e criar o resto pela própria UI):
   ```bash
   SEED_ADMIN_EMAIL=voce@dominio.com node --env-file=.env.local scripts/seed-admin.mjs
   ```
3. Em dev/teste, opcionalmente criar um usuário de cada role:
   ```bash
   node --env-file=.env.local scripts/create-test-users.mjs
   ```

## O que mudou em relação ao Supabase

- Sem RLS — autorização por role/academia é feita em código, ver
  `src/lib/auth/profile.ts` (`getCurrentUserProfile`, `scopeAcademiaId`) e os `actions.ts`
  de cada módulo.
- Sem Supabase Auth — login próprio com sessão em cookie (tabelas `users`/`sessions`).
- Sem Supabase Realtime — o funil (`/`) atualiza por polling, não subscription.
- `contacts`/`conversions` agora são criadas por este schema (no Supabase eram tabelas
  pré-existentes, nunca formalizadas em migration).
