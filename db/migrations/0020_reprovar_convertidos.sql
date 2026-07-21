-- Permite reprovar/cancelar um cliente convertido, dos dois lados da união exibida
-- em /convertidos (ver fetch-clientes-convertidos.ts): manual (clientes_alle) e
-- automático (conversions, sync do Alle Documentos).

-- clientes_alle: "reprovado" é um terceiro status, ao lado de ativo/pendente — cliente
-- que não vai virar (ou deixou de ser) cliente Alle. Fica registrado em vez de
-- excluído, pra não perder o histórico e pra permitir desfazer.
alter table clientes_alle drop constraint clientes_alle_status_check;
alter table clientes_alle add constraint clientes_alle_status_check
  check (status in ('ativo', 'pendente', 'reprovado'));

-- conversions: convertido pela Ane que não tem (e nunca teve) linha em clientes_alle —
-- reprovar aqui não pode depender de academia_id/nome estarem preenchidos (diferente
-- de promoverClienteConvertido, que precisa dos dois pra criar o cliente Alle), então
-- é uma coluna própria em vez de forçar a criação de um clientes_alle só pra guardar
-- a reprovação. null = ainda não decidido (é o estado de quem pode ser promovido ou
-- reprovado); 'reprovado' é o único valor não-null possível.
alter table conversions add column status text check (status is null or status = 'reprovado');

comment on column clientes_alle.status is '"ativo" = assinou o termo de adesão e é cliente Alle; "pendente" = ainda falta assinar; "reprovado" = reprovado/cancelado, não é (e não vai virar) cliente Alle.';
comment on column conversions.status is 'reprovado = marcado como reprovado/cancelado na tela de convertidos; null = ainda não decidido (segue disponível pra promover via cliente_alle_id).';
