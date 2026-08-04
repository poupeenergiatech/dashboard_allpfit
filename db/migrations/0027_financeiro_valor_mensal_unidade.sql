-- "Valor Mensal da Unidade X" em /financeiro: quantidade de conversões daquele mês
-- (Ane + manual, mesma contagem de fetch-academia-performance.ts) x valor por
-- conversão. Uma linha por academia/mês — histórico de verdade, não só o cálculo do
-- mês corrente: guarda o valor_por_conversao_centavos efetivamente usado em cada
-- linha (não uma constante lida na hora de exibir), então se esse valor mudar no
-- futuro, os meses já calculados mantêm o valor histórico correto. Recalculado (via
-- upsert) a cada carregamento de /financeiro pros últimos 12 meses — ver
-- src/lib/dashboard/financeiro-valor-mensal.ts.
create table financeiro_valor_mensal_unidade (
  id                            uuid primary key default gen_random_uuid(),
  academia_id                   uuid not null references academias (id),
  competencia_ano               smallint not null,
  competencia_mes               smallint not null check (competencia_mes between 1 and 12),
  quantidade_conversoes         integer not null default 0,
  valor_por_conversao_centavos  integer not null,
  valor_total_centavos          integer not null,
  calculado_em                  timestamptz not null default now(),
  unique (academia_id, competencia_ano, competencia_mes)
);

create index financeiro_valor_mensal_unidade_competencia_idx
  on financeiro_valor_mensal_unidade (competencia_ano, competencia_mes);

comment on table financeiro_valor_mensal_unidade is 'Histórico do valor mensal por academia (conversões do mês x valor por conversão) exibido em /financeiro.';
comment on column financeiro_valor_mensal_unidade.valor_por_conversao_centavos is 'Valor por conversão efetivamente usado nesse cálculo (centavos) — histórico, não a constante atual do código.';
