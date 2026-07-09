# Sprint 6 — relatório diário de novos contatos via webhook

## O que foi feito

- **`/configuracoes` (Super Admin)**: tela para salvar a "Destino do Relatório — URL do
  Webhook" e testar o envio manualmente para uma data específica.
- **`/api/relatorio`**: rota de sistema (protegida por `CRON_SECRET`) que monta o relatório de
  novos contatos do dia anterior, agrupado por academia, e envia um `POST` para a URL salva em
  `/configuracoes`. Aceita `?data=YYYY-MM-DD` para reprocessar um dia específico.
- **`contacts.telefone`** (migration `0011`): coluna nova para o telefone individual do
  contato — não existia antes (só o telefone da *academia*/instância era guardado).
- **`report_settings`** (migration `0012`): tabela singleton com a URL do webhook, RLS restrita
  a `super_admin`.
- **Correção de bug pré-existente no middleware**: `/api/*` estava passando pelo redirect de
  sessão do Supabase (`src/lib/supabase/middleware.ts`), então qualquer chamada sem cookie de
  navegador — como um cron batendo em `/api/relatorio` ou `/api/agregador` — recebia um
  `307` para `/login` em vez do JSON esperado. `/api` agora fica fora do matcher do
  middleware; cada rota de sistema cuida da própria autenticação.

## Formato do payload

```json
{
  "data_relatorio": "07/07/2026",
  "gerado_em": "08/07/2026 00:00",
  "total_novos_contatos": 3,
  "por_academia": [
    {
      "academia": "Academia Boa Viagem",
      "telefone_numero": "5584999990001",
      "novos_contatos": 3,
      "contatos": [
        { "nome": "João Silva", "telefone": "5581987654321", "recebido_em": "07/07/2026 09:12" }
      ]
    }
  ]
}
```

Academias sem novos contatos no dia não aparecem em `por_academia`. `total_novos_contatos` é
sempre a soma de `novos_contatos` — calculado, não pode ficar inconsistente.

## PREMISSA A VALIDAR COM A EQUIPE DO AGREGADOR

O agregador de números ainda não tem contrato de API real documentado (mesmo risco já
registrado em `src/app/api/agregador/route.ts` desde a Sprint 2). Para este relatório
funcionar de verdade, o endpoint `/contatos/hoje` do agregador precisa expor o telefone
**individual do cliente** — hoje o placeholder assume um campo `telefone_contato` no payload de
sincronização (distinto de `numero_telefone`, que identifica a *instância/academia*). Sem essa
confirmação, `contatos[].telefone` no relatório sai sempre `null`.

## Não deu pra fazer sem acesso real (fica com você)

| Tarefa | Por quê | O que fazer |
| --- | --- | --- |
| Confirmar o campo de telefone do contato no agregador | Depende do contrato real da API, que não temos | Validar com quem administra o agregador e ajustar `AgregadorContato` em `src/app/api/agregador/route.ts` se o nome do campo for outro |
| Configurar o cron externo de `/api/relatorio` | Depende de acesso ao EasyPanel (ou outro disparador) | Ver seção "Cron do relatório diário" em `docs/DEPLOY.md` |
| Rodar as migrations `0011`/`0012` no Supabase real | Precisa de acesso ao projeto Supabase de produção | `supabase db push` ou colar o SQL no SQL Editor |
| Testar o envio ponta a ponta | Precisa de uma URL de webhook real (ex.: um endpoint de teste no Zapier/n8n/webhook.site) | Colar a URL em `/configuracoes` e usar o botão "Enviar agora" |
