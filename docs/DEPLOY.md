# Deploy no EasyPanel (S1-08 a S1-11, retomado na Sprint 5)

O `Dockerfile` na raiz do projeto foi criado e validado localmente (build multi-stage com
`output: "standalone"` do Next.js — testei rodando o `server.js` gerado fora do Docker, já
que o ambiente onde estou não tem o Docker disponível para buildar a imagem de verdade).

## Passo a passo no EasyPanel

1. Criar um novo serviço do tipo "App" apontando para este repositório (branch `main` ou a
   que você usar para produção).
2. EasyPanel deve detectar o `Dockerfile` automaticamente. Porta interna do container: `3000`.
3. Configurar as variáveis de ambiente do serviço (mesmas do `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AGREGADOR_API_URL` / `AGREGADOR_API_KEY` (se já tiver)
   - `CRON_SECRET` (protege `/api/relatorio` — gere um valor aleatório qualquer)

   **Atenção:** as duas primeiras (`NEXT_PUBLIC_*`) precisam estar disponíveis em **build
   time**, não só em runtime — elas ficam embutidas no bundle JS que vai pro navegador. Se o
   EasyPanel só injeta env vars em runtime, configure-as também como build args do serviço
   (ou rode `docker build --build-arg` apontando pra elas, ajustando o Dockerfile pra
   declarar `ARG`/`ENV` correspondentes).
4. Reservar/configurar a porta e o domínio do serviço, com SSL (Let's Encrypt automático do
   EasyPanel, se disponível).
5. Deploy. Testar a URL pública: deve redirecionar pra `/login` sem sessão.
6. Configurar CI/CD: push na branch de produção → deploy automático (GitHub + EasyPanel,
   conforme o documento de sprints).

## Cron do relatório diário (`/api/relatorio`)

O EasyPanel não roda cron dentro do container por conta própria — é preciso um disparador
externo batendo em `GET https://SEU_DOMINIO/api/relatorio` uma vez por dia (logo depois da
meia-noite, já que o relatório é sempre do dia anterior), enviando o header
`Authorization: Bearer $CRON_SECRET`. Três formas de fazer isso, escolha a mais simples pro
seu ambiente:

- **Cron Jobs do próprio EasyPanel**, se o plano/versão oferecer essa opção no serviço.
- **GitHub Actions agendado** (`schedule: cron: '5 0 * * *'`) rodando um `curl` simples — não
  precisa de infra extra, só um secret do repositório com o `CRON_SECRET`.
- **crontab de um servidor que você já controla**: `5 0 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://SEU_DOMINIO/api/relatorio`

O endpoint aceita `?data=YYYY-MM-DD` pra reprocessar um dia específico manualmente. A URL de
destino do relatório (pra onde o POST é enviado) é configurada pelo Super Admin em
`/configuracoes`, não por variável de ambiente.

## Checklist de validação pós-deploy

- [ ] URL pública acessível com SSL ativo
- [ ] `/login` carrega e autentica com um usuário real
- [ ] Rotas protegidas redirecionam sem sessão
- [ ] Funil carrega dados reais e atualiza via Realtime
- [ ] `/api/agregador` consegue alcançar a API do agregador (sem bloqueio de rede/firewall
      entre o EasyPanel e o agregador)
- [ ] `/api/relatorio?data=YYYY-MM-DD` (com o header `Authorization`) retorna `sent: true`
      depois de configurar uma URL de teste em `/configuracoes`
- [ ] Cron externo do relatório diário configurado (ver seção acima)

Isso fecha o que tinha ficado pendente da Sprint 1 (S1-09 a S1-11) — eu não tenho acesso ao
painel do EasyPanel, então esses passos precisam ser executados por você.
