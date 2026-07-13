-- Histórico de execuções do sync Alle Documentos -> conversions (ver
-- syncAlleDocumentosConvertidos / runAlleDocumentosSync), tanto disparadas pelo
-- botão manual em /configuracoes quanto pelo endpoint de cron
-- /api/sync-alle-documentos. Uma linha por execução, sucesso ou erro.
create table alle_documentos_sync_log (
  id                 uuid primary key default gen_random_uuid(),
  triggered_by       text not null check (triggered_by in ('manual', 'automatico')),
  status             text not null check (status in ('sucesso', 'erro')),
  total_convertidos  integer,
  inseridas          integer,
  ja_existentes      integer,
  nao_encontradas    jsonb not null default '[]'::jsonb,
  error_message      text,
  created_at         timestamptz not null default now()
);

create index alle_documentos_sync_log_created_at_idx on alle_documentos_sync_log (created_at desc);
