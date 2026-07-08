# Sprint 4 — decisões tomadas e premissas a validar

## Decisões de organização da UI

- **Entrada manual (S4-11/S4-12) virou 1 formulário, não 2.** O documento lista "alunos" e
  "scans QR" como duas tarefas separadas, mas ambos os campos vivem na mesma linha da tabela
  `manual_data` (chave única `academia_id + data`). Um único formulário com os dois campos
  evita dois upserts distintos brigando pela mesma linha. Fica na página **Performance por
  Academia**, não como item próprio na sidebar (fazia mais sentido colado à tabela que ele
  alimenta).
- **Toggle de "Academias Treinadas"** é otimista no client (marca a mudança na tela na hora,
  reverte se a Server Action falhar) — assim o toggle parece instantâneo mesmo com round-trip
  ao Supabase.

## Premissas a validar com Supabase real

- **`Números (WhatsApp)`** — o "status online/offline" pedido no documento (S4-06) assume um
  sinal em tempo real do agregador que não temos modelado. Por enquanto uso `academias.ativo`
  como proxy (fica avisado na própria tela). Quando o agregador expuser status real por
  número, troco a fonte em `src/lib/dashboard/fetch-numeros.ts`.
- **Listagem de usuários** usa `supabase.auth.admin.listUsers()`, que pagina em 50 por
  página por padrão — sem paginação na UI ainda (não pedida no documento). Se o total de
  usuários reais passar disso, aviso e adiciono paginação.
- **Convite de usuário** usa `auth.admin.inviteUserByEmail()`, que depende do envio de email
  estar configurado no projeto Supabase (funciona por padrão, mas com rate limit baixo no
  free tier — para volume maior de convites, configurar um provedor SMTP customizado no
  painel do Supabase).

## O que foi validado de verdade

Sem Supabase real, dá pra confirmar: build de produção, typecheck, lint, e que as 5 rotas
novas (`/performance`, `/pendentes`, `/numeros`, `/treinadas`, `/usuarios`) redirecionam para
`/login` sem sessão — igual às sprints anteriores. A view `academia_performance` (nova
migration 0010) foi testada com dados reais e 2 roles diferentes no Postgres local
(mesmo processo de validação da Sprint 2) e agregou/filtrou corretamente por RLS.

**Não testado ainda** (precisa de Supabase real + usuários de teste da Sprint 2): os fluxos
de escrita ponta a ponta — marcar pendente como assinado, salvar dados manuais e ver refletir
no funil, toggle de treinada, convite de usuário — e a restrição visual "Visualizador não vê
botões de edição em nenhum módulo" (S4-16). A lógica de cada um está isolada nas respectivas
`actions.ts` e já reforçada por RLS, mas o teste ponta a ponta fica pendente.

### Checklist para quando houver credenciais reais

| Módulo | Como testar |
| --- | --- |
| Performance | Comparar contatos/conversões da tabela com `select` direto na view `academia_performance` |
| Dados manuais | Salvar alunos/scans e conferir que o funil (`/`) reflete na hora (via Realtime) |
| Pendentes | Clicar "Assinou" com `teste.coordenador` — linha deve sumir da lista; com `teste.visualizador`, botão não deve aparecer |
| Treinadas | Toggle com `teste.gestor` funciona; com `teste.coordenador`, toggle fica desabilitado (RLS bloquearia mesmo se não estivesse) |
| Usuários | Só `teste.superadmin` acessa `/usuarios`; convidar um usuário novo e conferir que `user_profiles` foi criado com role/academia certos |
