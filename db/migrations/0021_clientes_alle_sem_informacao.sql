-- Quarto status pra clientes_alle: "sem_informacao" — cliente cadastrado/importado
-- sem dado suficiente pra classificar como ativo, pendente ou reprovado (ex.: linha
-- de CSV incompleta que ainda precisa de checagem manual). Não conta como "ativo" em
-- nenhuma contagem (fetch-funnel-counts.ts) nem como "pendente" no backlog de
-- assinatura (fetch-pendencias-assinatura.ts) — é um estado neutro, separado dos
-- outros três.
alter table clientes_alle drop constraint clientes_alle_status_check;
alter table clientes_alle add constraint clientes_alle_status_check
  check (status in ('ativo', 'pendente', 'reprovado', 'sem_informacao'));

comment on column clientes_alle.status is '"ativo" = assinou o termo de adesão e é cliente Alle; "pendente" = ainda falta assinar; "reprovado" = reprovado/cancelado, não é (e não vai virar) cliente Alle; "sem_informacao" = cadastro sem dado suficiente pra classificar.';
