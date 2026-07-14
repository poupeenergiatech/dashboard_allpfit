-- Histórico de payloads recebidos em /api/webhooks/scans (RPA que lê os scans de QR code
-- do dia) — mesmo espírito de agregador_webhook_log, mas cada bloco carrega só um
-- total_scans por academia/dia, sem lista de contatos individuais pra detalhar.
create table scans_webhook_log (
  id                        uuid primary key default gen_random_uuid(),
  status                    text not null check (status in ('sucesso', 'erro')),
  payload                   jsonb,
  distribuicao              jsonb not null default '[]'::jsonb,
  total_academias           integer,
  total_academias_ok        integer,
  academias_nao_encontradas jsonb not null default '[]'::jsonb,
  error_message             text,
  created_at                timestamptz not null default now()
);

create index scans_webhook_log_created_at_idx on scans_webhook_log (created_at desc);
