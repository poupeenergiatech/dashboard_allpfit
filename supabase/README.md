# Banco de dados — Sprint 2

Migrations em `migrations/` (ordem numérica), seed manual em `seed/`.

## Como aplicar

**Opção A — SQL Editor do Supabase (mais simples, sem CLI):**
Cole e rode cada arquivo de `migrations/` em ordem (0001 → 0010) no SQL Editor do projeto.
Depois preencha e rode `seed/academias.sql` manualmente.

**Opção B — Supabase CLI:**
```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```
O `db push` aplica tudo em `migrations/` na ordem correta. `seed/` fica de fora de propósito
(ver comentário no arquivo) — rode à parte depois de preenchido:
```bash
psql "$DATABASE_URL" -f supabase/seed/academias.sql
```

## Ordem e o que cada migration faz

| Arquivo | O que faz |
| --- | --- |
| `0001_academias.sql` | Tabela `academias` |
| `0002_user_profiles.sql` | Tabela `user_profiles` (role + academia_id) |
| `0003_manual_data.sql` | Tabela `manual_data` (alunos/scans manuais) |
| `0004_pending_signatures.sql` | Tabela `pending_signatures` |
| `0005_trained_academias.sql` | Tabela `trained_academias` |
| `0006_contacts_conversions_academia_id.sql` | Adiciona `academia_id` em `contacts`/`conversions` — **exige backfill manual**, ver comentário no arquivo |
| `0007_rls_helper_functions.sql` | Funções `current_user_role()`, `current_user_academia_id()`, `is_admin_or_gestor()` |
| `0008_rls_policies.sql` | Habilita RLS e cria as policies por role em todas as tabelas |
| `0009_realtime.sql` | Adiciona `contacts`, `conversions`, `manual_data` à publication `supabase_realtime` |
| `0010_academia_performance_view.sql` | View `academia_performance` (contatos/conversões agregados por unidade, com RLS via `security_invoker`) |
| `0011_contacts_telefone.sql` | Adiciona `telefone` em `contacts` (telefone individual do contato, usado no relatório diário) |
| `0012_report_settings.sql` | Tabela `report_settings` (URL do webhook do relatório diário, ver `/configuracoes`) |
| `0013_contacts_webhook_unique.sql` | Constraint única em `contacts (academia_id, telefone, created_at)` — upsert idempotente em `POST /api/webhooks/agregador` |

## Depois de aplicar

1. Rodar `seed/academias.sql` com a lista real das 31 unidades (nome + número de WhatsApp)
2. Resolver o backfill de `academia_id` em `contacts`/`conversions` (ponto de atenção do 0006)
3. Criar o primeiro Super Admin (só assim dá pra logar e convidar o resto pela própria UI):
   `SEED_ADMIN_EMAIL=voce@dominio.com node --env-file=.env.local scripts/seed-admin.mjs`
4. Em dev/teste, opcionalmente criar um usuário de cada role:
   `node --env-file=.env.local scripts/create-test-users.mjs`
5. Seguir o checklist de `docs/SPRINT2_RLS_TESTING.md`
