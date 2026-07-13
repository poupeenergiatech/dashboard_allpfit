-- Liga/desliga a sincronização automática diária do Alle Documentos (ver
-- sync-scheduler.ts) — desligada por padrão, Super Admin ativa em /configuracoes.
-- Mesmo padrão de linha única do report_settings (0001_init.sql).
create table alle_documentos_sync_settings (
  id          smallint primary key default 1 check (id = 1),
  enabled     boolean not null default false,
  updated_at  timestamptz not null default now()
);

comment on table alle_documentos_sync_settings is 'Configuração global (linha única) do sync automático diário Alle Documentos -> conversions.';

insert into alle_documentos_sync_settings (id) values (1) on conflict (id) do nothing;
