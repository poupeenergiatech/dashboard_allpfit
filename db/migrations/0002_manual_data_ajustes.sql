-- Correção manual de contatos/conversões por dia — contacts/conversions são
-- alimentados automaticamente pelo agregador (webhook); quando esse dado falha ou
-- vem errado, um Super Admin/Gestor precisa poder corrigir o número do dia sem
-- mexer nos registros individuais. Quando não nula, a coluna substitui a contagem
-- automática daquele academia_id/data (ver src/lib/dashboard/fetch-funnel-counts.ts
-- e fetch-academia-performance.ts).

alter table manual_data
  add column contatos_ajuste integer,
  add column conversoes_ajuste integer;

comment on column manual_data.contatos_ajuste is 'Correção manual do total de contatos do dia — substitui a contagem automática de contacts quando não nula.';
comment on column manual_data.conversoes_ajuste is 'Correção manual do total de conversões do dia — substitui a contagem automática de conversions quando não nula.';
