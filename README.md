# Dashboard de Performance — Allp Fit × Alle Energia

Painel de monitoramento em tempo real das operações de aquisição de clientes da Alle Energia
nas unidades Allp Fit. Ver plano completo em [`docs/Sprints_Dashboard_Performance.pdf`](./docs/Sprints_Dashboard_Performance.pdf).

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + Realtime) · Tailwind CSS ·
Recharts · EasyPanel (Docker)

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais reais do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem sessão válida, qualquer rota redireciona
para `/login`. Com o banco migrado (ver [`supabase/README.md`](./supabase/README.md)) mas sem
nenhum usuário ainda, crie o primeiro login de Super Admin com:

```bash
SEED_ADMIN_EMAIL=voce@dominio.com node --env-file=.env.local scripts/seed-admin.mjs
```

Sem `SEED_ADMIN_PASSWORD`, uma senha é gerada e impressa uma única vez no terminal.

## Variáveis de ambiente

| Variável | Onde encontrar |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API, no painel do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (uso restrito a server-side) |
| `AGREGADOR_API_URL` / `AGREGADOR_API_KEY` | Fornecido pela equipe do agregador de números WhatsApp (opcional — sem elas, `/api/agregador` só faz no-op) |
| `CRON_SECRET` | Você define — protege `GET /api/relatorio` (envio de saída do relatório diário) |
| `AGREGADOR_WEBHOOK_SECRET` | Você define — protege `POST /api/webhooks/agregador` (entrada de contatos do agregador) |

## Status do desenvolvimento (por sprint)

- [x] **Sprint 1** — Infraestrutura, autenticação e estrutura base (código pronto; deploy no
      EasyPanel fica pendente até você configurar o serviço)
- [x] **Sprint 2** — Schema do banco, RLS e seed de academias (migrations prontas em
      `supabase/`, RLS testada localmente; falta aplicar no projeto Supabase real — ver
      `supabase/README.md`)
- [x] **Sprint 3** — Dashboard principal: funil e tempo real (código pronto e validado
      estruturalmente — build/lint/typecheck; funil real e Realtime só testáveis com
      Supabase real, ver `docs/SPRINT3_NOTES.md` para premissas assumidas)
- [x] **Sprint 4** — Módulos secundários e gestão manual (performance por academia, dados
      manuais, pendentes, números, treinadas, gestão de usuários — código pronto e validado
      estruturalmente; ver `docs/SPRINT4_NOTES.md` para decisões e premissas assumidas)
- [x] **Sprint 5** — Testes, ajustes, documentação e entrega (toasts, skeleton loaders,
      estados de erro/vazio, responsividade validada com screenshots em 375/768/1280px,
      Dockerfile criado e validado, documentação de acesso — ver `docs/SPRINT5_NOTES.md`
      para o que ainda depende de você: usuários reais, dados históricos e deploy)

## Deploy

Dockerfile na raiz, com `output: "standalone"` configurado no Next. Passo a passo completo
pro EasyPanel em [`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Banco de dados (Supabase)

Migrations, policies de RLS e script de seed estão em [`supabase/`](./supabase/README.md).
Nada disso roda sozinho — precisa ser aplicado manualmente no projeto Supabase real (SQL
Editor ou `supabase db push`) assim que as credenciais estiverem disponíveis. Checklist de
teste de RLS por role em [`docs/SPRINT2_RLS_TESTING.md`](./docs/SPRINT2_RLS_TESTING.md).

## Documentação de acesso e uso

[`docs/ACCESS.md`](./docs/ACCESS.md) — URLs, onde ficam as credenciais e um guia rápido de
cada módulo por perfil de acesso. Pensado pra ser entregue à equipe/gestores (S5-12).

## Estrutura relevante

```
src/
  app/
    (app)/            # área autenticada — layout com sidebar/topbar
      performance/     # tabela por academia + entrada manual (alunos/scans)
      pendentes/        # pendentes de assinatura
      numeros/            # status dos números de WhatsApp por academia
      treinadas/           # toggle de academias treinadas
      usuarios/             # gestão de usuários (Super Admin)
    api/agregador/     # route handler que sincroniza contatos do dia do agregador
    login/              # login público (Server Action)
    auth/logout/         # route handler de logout
  components/
    layout/                # Topbar, Sidebar (com drawer mobile), LogoutButton
    dashboard/               # cards do funil, tabelas, formulários, grids de toggle
    ui/                       # toast, skeletons, error boundary — compartilhados
  lib/
    supabase/                 # clients browser/server/admin + helper de middleware + profile
    dashboard/                 # tipos, cálculo de período, queries do funil/performance/módulos
  middleware.ts                # protege rotas autenticadas via Supabase Auth
supabase/
  migrations/            # schema + RLS + view de performance, numeradas e idempotentes
  seed/academias.sql      # seed manual das 31 unidades (preencher antes de rodar)
scripts/
  seed-admin.mjs          # cria/promove o primeiro Super Admin via Admin API
  create-test-users.mjs   # cria 1 usuário de teste por role via Admin API
```
