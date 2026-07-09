# Documento de Acesso — Dashboard de Performance Allp Fit × Alle Energia

## URLs

| Ambiente | URL |
| --- | --- |
| Produção | _preencher após o deploy no EasyPanel (S5-13)_ |
| Local (dev) | http://localhost:3000 |

## Credenciais

Não há credenciais fixas do dashboard em si — o login é feito com o email/senha de cada
usuário, cadastrado no Supabase Auth pelo Super Admin (ver "Gestão de usuários" abaixo).

O primeiro Super Admin (antes de existir qualquer usuário pra convidar os demais pela UI) é
criado rodando `scripts/seed-admin.mjs` — ver [`README.md`](../README.md#rodando-localmente).

| Serviço | Onde ver/gerenciar |
| --- | --- |
| Supabase (projeto) | painel do Supabase — Project Settings → API para URL/keys |
| EasyPanel (hospedagem) | painel do EasyPanel do serviço `dashboard-allpfit` (ou nome equivalente) |
| Agregador de números | credenciais fornecidas pela equipe do agregador (`AGREGADOR_API_URL`/`AGREGADOR_API_KEY`) |

_Nunca compartilhe a `SUPABASE_SERVICE_ROLE_KEY` fora do `.env` do servidor — ela ignora
todas as permissões (RLS)._

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
- **Usuários** (`/usuarios`, só Super Admin) — lista quem tem acesso e permite convidar
  alguém novo por email, definindo a role e (quando aplicável) a academia vinculada.

## Suporte técnico

Repositório do código e documentação técnica: ver `README.md` na raiz do projeto e os
documentos `docs/SPRINT*_NOTES.md` para decisões e limitações conhecidas de cada sprint.
