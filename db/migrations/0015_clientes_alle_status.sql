-- Substitui o boolean `ativo` por um status de duas fases: "pendente" (ainda não
-- assinou o termo de adesão à Alle Energia) e "ativo" (assinou, é cliente ativo).
-- A lista completa (dos dois tipos) passa a ser importada em lote via CSV — ver
-- importClientesAlleCsv em src/app/(app)/clientes-alle/actions.ts.
alter table clientes_alle add column status text not null default 'pendente' check (status in ('ativo', 'pendente'));
update clientes_alle set status = case when ativo then 'ativo' else 'pendente' end;
alter table clientes_alle drop column ativo;

comment on column clientes_alle.status is '"ativo" = assinou o termo de adesão e é cliente Alle; "pendente" = ainda falta assinar.';

drop index if exists clientes_alle_ativos_idx;
create index clientes_alle_ativos_idx on clientes_alle (academia_id) where status = 'ativo';
