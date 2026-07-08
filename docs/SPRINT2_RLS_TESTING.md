# Sprint 2 — Checklist de teste das policies RLS

Pré-requisitos: migrations aplicadas, `seed/academias.sql` rodado, usuários de teste criados
(`node --env-file=.env.local scripts/create-test-users.mjs`).

## Teste rápido no SQL Editor (impersonando um usuário)

O PostgREST do Supabase injeta `request.jwt.claims` com o `sub` (user id) do usuário
autenticado antes de rodar a query — é isso que faz `auth.uid()` funcionar dentro das
policies. Dá pra simular isso direto no SQL Editor:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub": "<user_id do usuário de teste>"}';

select * from academias;      -- deve retornar só o esperado pro role desse usuário
select * from contacts;
```

Pegue o `user_id` de cada usuário de teste em Authentication → Users no painel do Supabase.

## Matriz de aceite (Entregáveis da Sprint 2)

| Cenário | Como testar | Esperado |
| --- | --- | --- |
| Migrations aplicadas sem erro | `supabase db push` ou colar no SQL Editor | Nenhum erro |
| RLS funcionando | Logar como `teste.coordenador` (academia A) e tentar ler dados de outra academia | Nenhuma linha da academia B retorna |
| Realtime ativo | `insert into contacts (...) values (...);` com o SQL Editor aberto em outra aba com subscription ativa | Evento chega em tempo real |
| Academias cadastradas | `select count(*) from academias;` | 31 |
| super_admin / gestor veem tudo | Logar com `teste.superadmin` e `teste.gestor` | Todas as academias em `academias`, `contacts`, `conversions`, `manual_data`, `pending_signatures` |
| coordenador só vê a própria | Logar com `teste.coordenador` | Só linhas da academia vinculada em `user_profiles.academia_id` |
| visualizador só vê a própria e não escreve | Logar com `teste.visualizador`, tentar `insert`/`update` em `manual_data` | Select limitado à própria academia; insert/update bloqueado pela policy (erro de RLS) |
| trained_academias só super_admin/gestor escrevem | Tentar `update trained_academias` como `teste.coordenador` | Bloqueado; como `teste.gestor`, funciona |
| user_profiles só super_admin gerencia | Tentar `insert into user_profiles` como `teste.gestor` | Bloqueado; como `teste.superadmin`, funciona |

> **Nota de comportamento do Postgres:** um `UPDATE` bloqueado pelo `USING` de uma policy não
> gera erro — ele simplesmente afeta 0 linhas (a policy filtra a linha antes do update chegar
> nela), porque o Postgres já esconde as linhas invisíveis do usuário atual antes de aplicar
> o `UPDATE`. Já um `INSERT` bloqueado pelo `WITH CHECK` gera um erro explícito de RLS. Isso já
> foi confirmado rodando as migrations reais deste repositório contra um Postgres local (com
> `auth.uid()`/roles simulados) — todas as 4 roles se comportaram como na tabela acima. A UI
> (Sprint 4/5) precisa tratar "0 linhas afetadas" num update como falha de permissão, não como
> sucesso silencioso.

## Teste end-to-end pela aplicação (depois da Sprint 3/4)

Login com cada um dos 4 usuários de teste e conferir que a sidebar/filtros só mostram o que
a role permite — mas isso só é totalmente verificável quando os módulos de UI que consomem
essas tabelas existirem (Sprints 3 e 4). Nesta sprint, o teste é a nível de banco (SQL Editor)
mesmo.
