# Sessão 2026-07-10 — conclusão da migração Postgres + gestão de academias + gráficos

## Contexto

Retomada da sessão anterior (ver `docs/POSTGRES_MIGRATION_NOTES.md`), que tinha deixado a
migração Supabase → Postgres próprio "em andamento". Esta sessão fechou o que faltava e
adicionou funcionalidades novas pedidas ao longo da conversa.

## 1. Migração Supabase → Postgres (concluída)

Completado o que estava pendente:

- `fetch-funnel-counts.ts` virou Server Action (`'use server'`), com `scopeAcademiaId()`
  aplicado. `use-funnel-data.ts` trocou a subscription do Supabase Realtime por polling
  (`setInterval`, ~10s) — indicador "AO VIVO" preservado.
- Gestão de usuários (`/usuarios`): convite por email (dependia do serviço de email do
  Supabase) virou "criar usuário com senha gerada" — a action retorna a senha, mostrada
  uma única vez num card na UI.
- `/api/agregador` e `/api/webhooks/agregador`: trocado `createAdminClient()` (supabase-js)
  por `pool.query` direto.
- `scripts/seed-admin.mjs` e `scripts/create-test-users.mjs`: reescritos pra `pg` puro, hash
  de senha com `node:crypto scrypt` inline (evita puxar TypeScript num script `node` cru).
- `.env.example`, `docs/DEPLOY.md`, `docs/ACCESS.md`, `README.md`: atualizados — `DATABASE_URL`
  documentada, Supabase (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`) mantido só como comentário de
  uso futuro somente-leitura (`src/lib/supabase/readonly.ts`, não usado em nenhuma feature).

Único resquício do Supabase no código: `src/lib/supabase/readonly.ts`, documentado e sem
nenhum caller — reservado pra um futuro `GET` em `alle_documentos_clientes`.

Verificado localmente (Postgres 16 na porta 5432 deste sandbox): `npm run build` limpo,
login real (scrypt + sessão em cookie), escopo por academia por role, logout, todas as
páginas renderizando sem erro.

## 2. Deploy — migrations automáticas no container

Problema encontrado em produção: `relation "users" does not exist" — o schema novo nunca
tinha sido aplicado no Postgres de produção (sem passo de deploy pra isso).

Correção: `docker-entrypoint.sh` novo, roda `node scripts/migrate.mjs` (idempotente) antes de
`server.js`. `Dockerfile` ajustado pra copiar `db/migrations` e `scripts/{migrate,seed-admin}.mjs`
pro runtime stage; `scripts` removido do `.dockerignore` (antes escondia o script do build
context inteiro, não só do runtime).

Validado localmente simulando a estrutura exata do standalone build (node_modules +
scripts + db copiados) contra um banco zerado — schema sobe do zero sem erro.

**Pendente pra você:** rodar, uma vez, dentro do shell do container em produção (depois do
próximo deploy):
```bash
SEED_ADMIN_EMAIL=leonard@poupeenergia.com node scripts/seed-admin.mjs
```
(`DATABASE_URL` já disponível como env var do serviço; sem `SEED_ADMIN_PASSWORD`, uma senha é
gerada e impressa uma única vez — copiar na hora).

## 3. Gestão de academias (`/academias`, novo — Super Admin)

Antes só dava pra cadastrar academia via SQL manual (`db/seed/academias.sql`). Agora:

- Tabela com todas as unidades (nome, número, toggle ativo/inativo — soft-disable, preserva
  histórico de contacts/conversions/manual_data).
- Formulário "Cadastrar academia" (nome + número WhatsApp).
- **Importação em lote via CSV** — duas colunas (`nome_academia`, `numero_whatsapp`), upsert
  por nome (nome já cadastrado tem o número atualizado; nome novo vira linha nova; sem
  delete). Parser CSV próprio (`src/lib/dashboard/csv.ts`, sem dependência nova), aguenta
  campo entre aspas com vírgula dentro.

Arquivos: `src/app/(app)/academias/{page,actions,loading,error}.tsx`,
`src/components/dashboard/{academias-table,create-academia-form,import-academias-form}.tsx`.

## 4. `/numeros` reorganizado — agrupado por número + card por academia

Motivador: várias unidades compartilham o mesmo número de WhatsApp; a listagem antiga (uma
linha de tabela por academia) duplicava o número e escondia o vínculo.

- `fetchNumeros` (`src/lib/dashboard/fetch-numeros.ts`) agora retorna `NumeroGroup[]`
  (agrupado por `numero_telefone`; unidades sem número configurado não se agrupam entre si —
  cada uma vira grupo de 1, pra não esconder quem falta configurar).
- Cada card de número mostra: número, badge de contagem ("3 unidades"), status agregado
  (Online se qualquer unidade do grupo estiver ativa), mensagens do dia somadas.
- **Cada academia vinculada vira seu próprio card visual** (avatar com iniciais, nome, bolinha
  de status individual verde/cinza) — não mais uma string truncada.

## 5. Gráficos (funil/dashboard + performance por academia)

Usando `recharts` (já era dependência, nunca tinha sido usada). Antes de escrever qualquer
gráfico, segui a skill de dataviz — cores validadas com `validate_palette.js`, não escolhidas
de olho.

- **Funil de conversão** (`/`): gráfico de funil de verdade (Alunos → Scans → Contatos →
  Conversões) — ordinal, uma cor em degradê (azul), porque o que importa é a posição na
  sequência, não identidade de série.
- **Contatos e conversões por dia** (`/`): linha com a tendência diária no período
  selecionado — nova série em `fetchFunnelCounts` (contagem diária de contacts/conversions,
  zero-preenchida pros dias sem registro). Escondido no período "Hoje" (1 ponto não é
  tendência).
- **Contatos e conversões por academia** (`/performance`): barras horizontais comparando as
  unidades, acima da tabela existente.
- Cores: emerald = contatos, amber = conversões (mesma identidade nos três lugares) — validado
  ΔE 39.3 (alvo ≥ 12). Ordinal do funil: degradê azul, validado com `--ordinal`.

## 6. Webhook de entrada do agregador (referência rápida)

Já existia (Sprint 7), só foi relembrado nesta sessão:

- `POST https://SEU_DOMINIO/api/webhooks/agregador`, header `Authorization: Bearer
  <AGREGADOR_WEBHOOK_SECRET>`, payload = mesmo shape do relatório de saída
  (`build-report-payload.ts`). Detalhes e exemplo de payload em `docs/SPRINT7_NOTES.md`.
- Sem a env var configurada, o endpoint recusa toda chamada (503).
- **Pendente pra você:** confirmar/gerar o `AGREGADOR_WEBHOOK_SECRET` de produção e configurar
  a URL + o secret no painel do sistema agregador (não tenho acesso a esse painel).

## Estado geral

Build/typecheck limpos. Testado localmente (Postgres 16 + Playwright headless) em cada
mudança: login, escopo por role, criação/toggle de academia, import CSV, agrupamento de
números, e os três gráficos novos — sem erros de console.

Commits desta sessão (branch `main`, todos já com push): migração Supabase→Postgres,
migrations automáticas no deploy, seed-admin no runtime image, gestão de academias, import
CSV, agrupamento de `/numeros`, gráficos, cards por academia em `/numeros`.
