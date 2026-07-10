# Documento de Acesso — Dashboard de Performance Allp Fit × Alle Energia

## URLs

| Ambiente | URL |
| --- | --- |
| Produção | _preencher após o deploy no EasyPanel (S5-13)_ |
| Local (dev) | http://localhost:3000 |

## Credenciais

Não há credenciais fixas do dashboard em si — o login é feito com o email/senha de cada
usuário, cadastrado no Postgres próprio pelo Super Admin (ver "Gestão de usuários" abaixo).
O Supabase não participa mais do login nem dos dados do dashboard — fica reservado a um
futuro `GET` somente-leitura (ex.: `alle_documentos_clientes`).

O primeiro Super Admin (antes de existir qualquer usuário pra criar os demais pela UI) é
criado rodando `scripts/seed-admin.mjs` — ver [`README.md`](../README.md#rodando-localmente).

| Serviço | Onde ver/gerenciar |
| --- | --- |
| Postgres (banco da aplicação) | connection string em `DATABASE_URL`, no `.env` do servidor |
| Supabase (projeto) | painel do Supabase — Project Settings → API para URL/keys (uso somente-leitura futuro) |
| EasyPanel (hospedagem) | painel do EasyPanel do serviço `dashboard-allpfit` (ou nome equivalente) |
| Agregador de números | credenciais fornecidas pela equipe do agregador (`AGREGADOR_API_URL`/`AGREGADOR_API_KEY`) |

_Nunca compartilhe a `DATABASE_URL` fora do `.env` do servidor — ela dá acesso completo de
leitura/escrita a todos os dados do dashboard, sem RLS (autorização por role/academia é
feita em código, não no banco)._

## Perfis de acesso

| Role | O que vê | O que pode editar |
| --- | --- | --- |
| **Super Admin** | Todas as academias, todos os módulos | Tudo, incluindo gestão de usuários |
| **Gestor** | Todas as academias | Tudo, exceto gestão de usuários |
| **Coordenador** | Só a própria academia | Dados manuais e pendentes da própria academia |
| **Visualizador** | Só a própria academia | Nada — acesso somente leitura |

## Como usar cada módulo

- **Funil / Dashboard** (`/`) — funil de conversão em tempo real. Filtre por academia (abas)
  e por período (Hoje / 7 dias / 30 dias). Atualiza sozinho quando chegam novos dados
  (indicador "AO VIVO" no canto superior direito).
- **Performance por Academia** (`/performance`) — tabela com contatos, conversões e taxa de
  conversão de cada unidade. Logo abaixo, quem tem permissão de escrita encontra o formulário
  para lançar o total de alunos e os scans de QR code do dia.
- **Pendentes de Assinatura** (`/pendentes`) — lista de clientes que ainda não assinaram o
  termo. O botão "Assinou" marca como concluído e a pessoa some da lista.
- **Números (WhatsApp)** (`/numeros`) — status e volume de mensagens do dia por número.
- **Academias Treinadas** (`/treinadas`) — toggle indicando se a equipe da unidade já
  recebeu o treinamento (só Super Admin/Gestor podem alterar).
- **Usuários** (`/usuarios`, só Super Admin) — lista quem tem acesso e permite criar
  alguém novo, definindo a role e (quando aplicável) a academia vinculada. A senha é gerada
  automaticamente e mostrada uma única vez na tela — copie e repasse na hora, ela não fica
  salva em nenhum lugar.

## Suporte técnico

Repositório do código e documentação técnica: ver `README.md` na raiz do projeto e os
documentos `docs/SPRINT*_NOTES.md` para decisões e limitações conhecidas de cada sprint.
