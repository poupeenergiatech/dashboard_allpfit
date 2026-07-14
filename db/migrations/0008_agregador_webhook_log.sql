-- Histórico de payloads recebidos em /api/webhooks/agregador — uma linha por chamada
-- autenticada, guardando o corpo bruto e como cada bloco "por_academia" foi distribuído
-- (qual academia casou pelo telefone_numero, quantos contatos entraram/foram ignorados).
create table agregador_webhook_log (
  id                      uuid primary key default gen_random_uuid(),
  status                  text not null check (status in ('sucesso', 'erro')),
  payload                 jsonb,
  distribuicao            jsonb not null default '[]'::jsonb,
  total_recebido          integer,
  total_inserido          integer,
  total_ignorado          integer,
  academias_nao_encontradas jsonb not null default '[]'::jsonb,
  error_message           text,
  created_at              timestamptz not null default now()
);

create index agregador_webhook_log_created_at_idx on agregador_webhook_log (created_at desc);
