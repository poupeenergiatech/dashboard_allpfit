-- Liga/desliga se clientes_alle com status sem_informacao/com_impedimentos/
-- falta_documentos contam como conversão no total (totalConversoesManual, ver
-- fetch-funnel-counts.ts e afins) — ativo/pendente/reprovado sempre contam,
-- essa configuração só amplia (ou não) pros outros três. Desligada por padrão,
-- Super Admin liga em /configuracoes. Mesmo padrão de linha única de
-- alle_documentos_sync_settings (0007) e report_settings (0001_init.sql).
create table conversao_status_settings (
  id                          smallint primary key default 1 check (id = 1),
  incluir_status_secundarios  boolean not null default false,
  updated_at                  timestamptz not null default now()
);

comment on table conversao_status_settings is 'Configuração global (linha única): se clientes_alle com status sem_informacao/com_impedimentos/falta_documentos contam como conversão no total (ativo/pendente/reprovado sempre contam).';

insert into conversao_status_settings (id) values (1) on conflict (id) do nothing;
