# Sprint 7 — webhook de entrada do agregador (recebendo contatos por push)

## Contexto

O `/api/agregador` (GET, Sprint 2) assumia que o dashboard *puxa* os contatos do dia batendo
numa API do agregador. Na prática o agregador funciona ao contrário: ele **empurra** (push)
um lote diário pro dashboard. `POST /api/webhooks/agregador` cobre esse caso — é a rota que
deve ser configurada como "Webhook URL" do lado do agregador.

`/api/agregador` (pull) continua existindo — não foi removido, mas hoje é redundante se o
agregador só vai empurrar dados via este webhook novo. Decida com a equipe do agregador qual
caminho fica ativo antes de configurar os dois; manter os dois ligados ao mesmo tempo não
quebra nada (ambos fazem upsert idempotente em `contacts`), só é sincronização duplicada.

## Contrato do payload (confirmado com você)

- **Cadência:** lote diário (não por contato/tempo real).
- **Autenticação:** header `Authorization: Bearer <AGREGADOR_WEBHOOK_SECRET>`.
- **Formato:** o mesmo shape do relatório que o dashboard envia (`build-report-payload.ts`) —
  o agregador reusa o contrato:

```json
{
  "data_relatorio": "07/07/2026",
  "gerado_em": "08/07/2026 00:00",
  "total_novos_contatos": 5,
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

`academia` e `novos_contatos` no payload de entrada são só informativos — quem identifica a
unidade de verdade é `telefone_numero` (batendo com `academias.numero_telefone`), e a
contagem real vem de `contatos.length`, não do campo `novos_contatos` declarado.

## O que foi feito

- **`POST /api/webhooks/agregador`** (`src/app/api/webhooks/agregador/route.ts`): valida o
  Bearer token, casa cada `telefone_numero` com uma academia, ignora (sem derrubar o lote
  inteiro) contatos sem `nome`/`recebido_em` válido ou academias não encontradas, e faz
  upsert em `contacts`.
- **Migration `0013_contacts_webhook_unique.sql`**: constraint única em
  `(academia_id, telefone, created_at)` — reenviar o mesmo lote (retry de rede) não duplica
  contatos.
- **`src/lib/dashboard/date-br.ts`**: extraído de `build-report-payload.ts` — agora tem
  também `parseDateTimeBR` (a operação inversa, necessária pra ler `recebido_em`).
- **`AGREGADOR_WEBHOOK_SECRET`**: diferente do `CRON_SECRET` de propósito — são credenciais
  de direções diferentes (uma protege *nosso* trigger de saída, a outra autentica *quem nos
  chama* de fora). Sem essa variável configurada, o endpoint recusa toda chamada (503) em vez
  de aceitar sem checagem — ele grava dados, então não tem "modo sem segredo" como o
  `/api/relatorio`.

## Resposta do endpoint

```json
{
  "recebido": true,
  "contatos_processados": 3,
  "contatos_ignorados": 0,
  "academias_nao_encontradas": []
}
```

Use `academias_nao_encontradas` pra pegar erro de cadastro (número de WhatsApp da unidade
diferente entre `academias.numero_telefone` e o que o agregador envia em `telefone_numero`).

## Fica com você

| Tarefa | Por quê |
| --- | --- |
| Configurar a URL `https://SEU_DOMINIO/api/webhooks/agregador` + o `AGREGADOR_WEBHOOK_SECRET` no painel do agregador | Não tenho acesso a esse painel |
| Rodar a migration `0013` no Supabase real | Precisa de acesso ao projeto |
| Decidir se `/api/agregador` (pull) continua ativo ou fica só o push | Depende do que o agregador de fato suporta — ver "Contexto" acima |
| Testar com um envio real do agregador e conferir `academias_nao_encontradas` | Só dá pra validar com o sistema de verdade |
