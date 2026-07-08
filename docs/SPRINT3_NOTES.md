# Sprint 3 — premissas assumidas e checklist de teste

Sem acesso ao Supabase real nem ao contrato da API do agregador, algumas decisões foram
tomadas com base no que o documento de sprints diz implicitamente. Preciso que você valide
os pontos abaixo assim que tiver as credenciais/documentação reais.

## 1. Ordem do funil e semântica de cada métrica

Assumi a ordem **Alunos totais → Scans QR → Contatos (WhatsApp) → Conversões**, com cada
taxa relativa à etapa anterior (`scans/alunos`, `contatos/scans`, `conversões/contatos`) —
é a leitura mais direta do texto "calcular e exibir taxas de conversão entre etapas
(scans/alunos, contatos/scans, etc.)".

Também assumi que:
- **`total_alunos`** é um *snapshot* (o total de alunos matriculados na data da última
  entrada manual dentro do período), não algo que se soma dia a dia.
- **`total_scans`** é aditivo (soma dos scans de cada dia dentro do período).

Se a intenção for outra (ex.: `total_alunos` também aditivo, ou a ordem do funil for
diferente), é só falar — a lógica está isolada em
[`src/lib/dashboard/fetch-funnel-counts.ts`](../src/lib/dashboard/fetch-funnel-counts.ts).

## 2. Coluna de data em `contacts`/`conversions`

O filtro de período (`hoje` / `7 dias` / `30 dias`) assume que essas duas tabelas —
já existentes no Supabase, segundo o documento — têm uma coluna `created_at` (padrão do
Supabase). Se o nome real for outro (`data`, `timestamp`, `inserted_at`...), ajuste as
constantes `CONTACTS_DATE_COLUMN` / `CONVERSIONS_DATE_COLUMN` no topo de
`fetch-funnel-counts.ts`.

## 3. Contrato da API do agregador

`src/app/api/agregador/route.ts` assume, sem confirmação:
- Endpoint: `{AGREGADOR_API_URL}/contatos/hoje`
- Auth: header `Authorization: Bearer {AGREGADOR_API_KEY}`
- Resposta: lista de objetos `{ id, nome?, numero_telefone, criado_em }`
- A academia de cada contato é resolvida casando `numero_telefone` com
  `academias.numero_telefone`

Isso é só um placeholder razoável para não travar o desenvolvimento. Assim que você tiver a
documentação real do agregador, me passa que eu ajusto essa rota (formato de resposta, path,
autenticação, nome dos campos).

## 4. O que só dá pra testar com Supabase real

Sem credenciais reais, validei: build de produção, typecheck, lint, e que as rotas
protegidas redirecionam corretamente para `/login` sem sessão. **Não deu pra exercitar**
o funil com dados de verdade nem o Realtime — isso depende do projeto Supabase estar com
as migrations da Sprint 2 aplicadas.

### Checklist para quando houver credenciais reais (critérios de aceite da Sprint 3)

| Critério | Como testar |
| --- | --- |
| Funil com dados reais | Comparar os números da tela com `select count(*) from contacts where ...` direto no Supabase |
| Filtro por academia funcional | Trocar a aba de academia e ver todos os 4 cards mudarem |
| Filtro de período funcional | Alternar Hoje/7 dias/30 dias e ver valores diferentes e coerentes (30d ≥ 7d ≥ hoje) |
| Realtime funcionando | Inserir uma linha em `contacts` pelo SQL Editor com o dashboard aberto — o card deve atualizar em até ~3s (debounce de 800ms + round-trip) |
| Endpoint do agregador | Com `AGREGADOR_API_URL` configurada, abrir o dashboard e checar no Network tab que `/api/agregador` é chamado a cada 30s |
| RLS respeitado no filtro | Logar como `teste.coordenador` (ver Sprint 2) e confirmar que só a própria academia aparece nas abas e nos números — mesmo tentando manipular o estado do filtro no client, a RLS impede ver dado de outra academia |
