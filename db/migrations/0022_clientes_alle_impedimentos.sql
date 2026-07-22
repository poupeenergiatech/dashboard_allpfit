-- Dois novos status pra clientes_alle: "com_impedimentos" (cliente com alguma
-- pendência que impede seguir, ex.: restrição cadastral) e "falta_documentos"
-- (aguardando documentação do cliente pra prosseguir). Mesmo tratamento de
-- "sem_informacao" (ver 0021): não contam como "ativo" em nenhuma contagem
-- (fetch-funnel-counts.ts) nem como "pendente" no backlog de assinatura
-- (fetch-pendencias-assinatura.ts) — são estados à parte, não um sub-tipo de
-- pendente.
alter table clientes_alle drop constraint clientes_alle_status_check;
alter table clientes_alle add constraint clientes_alle_status_check
  check (status in ('ativo', 'pendente', 'reprovado', 'sem_informacao', 'com_impedimentos', 'falta_documentos'));

comment on column clientes_alle.status is '"ativo" = assinou o termo de adesão e é cliente Alle; "pendente" = ainda falta assinar; "reprovado" = reprovado/cancelado, não é (e não vai virar) cliente Alle; "sem_informacao" = cadastro sem dado suficiente pra classificar; "com_impedimentos" = tem alguma pendência que impede seguir; "falta_documentos" = aguardando documentação do cliente.';
