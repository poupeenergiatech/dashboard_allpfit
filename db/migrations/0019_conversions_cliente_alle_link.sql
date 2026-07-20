-- Vincula um convertido da Ane ao registro correspondente em clientes_alle depois
-- que alguém confirma que a pessoa assinou o termo de adesão (ver
-- promoverClienteConvertido em src/app/(app)/convertidos/actions.ts) — null
-- enquanto ainda não foi promovido. `on delete set null`: excluir o cliente Alle
-- não apaga a conversão de origem, só desfaz o vínculo (permite promover de novo).
alter table conversions add column cliente_alle_id uuid references clientes_alle (id) on delete set null;

create index conversions_cliente_alle_id_idx on conversions (cliente_alle_id);
