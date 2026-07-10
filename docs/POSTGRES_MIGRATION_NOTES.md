# Migração Supabase → Postgres próprio

## Por que

O Supabase cobria três papéis: Auth (login/sessão), banco de dados de toda a aplicação e
Realtime (funil ao vivo). Decisão: Supabase passa a servir **só** para um futuro `GET`
somente-leitura na tabela `alle_documentos_clientes` (ainda não usada em nenhum lugar do
código). Todo o resto — autenticação e dados do dashboard — passa a viver num Postgres
próprio, com a connection string em `DATABASE_URL` no `.env`.

Motivador imediato: o primeiro deploy em produção não tinha nenhum usuário criado (não havia
seed rodado) — ao investigar isso, a decisão foi não apenas rodar o seed, mas parar de
depender do Supabase para login/dados no primeiro lugar.

## Decisões tomadas

- **Autenticação própria com sessão em cookie** (não JWT) — tabela `sessions` no Postgres.
  Cada login cria uma linha (`id` = token do cookie, `user_id`, `expires_at`); o cookie
  `session` é `httpOnly`, guarda só esse `id`. A cada requisição o servidor confere na tabela
  se a sessão existe e não expirou. Logout apaga a linha e limpa o cookie. Mesma ideia que o
  Supabase Auth já fazia, só que os dados agora moram no Postgres próprio em vez do Supabase.
- **Tempo real → polling.** Supabase Realtime (subscriptions `postgres_changes`) não tem
  equivalente pronto num Postgres genérico. O funil (`/`) passa a atualizar via
  `setInterval` (~10s) em vez de subscription.
- **RLS → autorização em código.** As policies de Row Level Security eram a barreira real de
  "coordenador só vê a própria academia". Sem RLS, isso vira responsabilidade explícita do
  código (`src/lib/auth/profile.ts` → `scopeAcademiaId()`), aplicado em toda leitura/escrita
  que hoje recebe um `academia_id` de fora.
- **Middleware em Edge runtime não pode falar com Postgres** (`pg` precisa de TCP cru, Edge
  não suporta). Solução: o middleware (`src/middleware.ts` / `src/lib/auth/middleware.ts`)
  só checa se existe um cookie de sessão (redireciona pra `/login` se não existir). A
  validação de verdade (sessão existe no banco? expirou?) roda em
  `src/app/(app)/layout.tsx`, que já roda em Node.js runtime — se a sessão for inválida,
  redireciona pra `/login` de lá.
- **`alle_documentos_clientes`**: só um client Supabase somente-leitura pronto e documentado
  (`src/lib/supabase/readonly.ts`), sem nenhuma feature nova usando ele ainda.
- **Convite de usuário por email** (dependia do serviço de email do Supabase) vira "criar
  usuário com senha gerada", mostrada uma vez na tela pro Super Admin repassar — mesmo
  padrão que `scripts/seed-admin.mjs` já usava.

Plano completo (arquivo por arquivo) está em `/home/poupe/.claude/plans/lively-swinging-map.md`
(fora do repo, no diretório de plans do Claude Code).

## Novo schema

`db/migrations/0001_init.sql` consolida as 13 migrations antigas do Supabase
(`academias`, `user_profiles`, `manual_data`, `pending_signatures`, `trained_academias`,
`contacts`, `conversions`, `report_settings`, view `academia_performance`), sem RLS, mais as
tabelas novas `users` e `sessions`. Aplicar com `node --env-file=.env.local scripts/migrate.mjs`
— detalhes em `db/README.md`.

## Status (em andamento)

Concluído:
- Dependências (`pg` adicionado, `@supabase/ssr` removido).
- Schema consolidado + migration runner (`scripts/migrate.mjs`) + `db/README.md`.
- Pool de conexão (`src/lib/db/pool.ts`).
- Camada de auth: `src/lib/auth/{password,session,cookie,profile}.ts`.
- Middleware simplificado + libs antigas de `src/lib/supabase/*` removidas (exceto o novo
  `readonly.ts`).
- Login, logout, topbar e layout `(app)` reescritos para sessão em cookie.

Em andamento:
- Reescrever os módulos de leitura/escrita do dashboard (`fetch-*.ts`, `actions.ts` de cada
  página) trocando `supabase-js` por SQL via `pg`, aplicando `scopeAcademiaId()` em cada um.

Pendente:
- Funil (`fetch-funnel-counts.ts` + `use-funnel-data.ts`): virar Server Action + polling.
- Rotas do agregador (`/api/agregador`, `/api/webhooks/agregador`).
- Fluxo de criar usuário (substituindo convite por email) + UI da senha gerada.
- Reescrever `scripts/seed-admin.mjs` e `scripts/create-test-users.mjs` para `pg`.
- Atualizar `.env.example`, `docs/DEPLOY.md`, `docs/ACCESS.md`, `README.md` raiz.
- Build/typecheck + verificação ponta a ponta com Postgres local (há um Postgres 16 já
  instalado e rodando na porta 5432 neste ambiente, usado para testar antes de reportar como
  concluído).
