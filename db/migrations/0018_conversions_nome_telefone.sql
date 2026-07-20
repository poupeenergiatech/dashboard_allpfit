-- Nome e telefone do convertido, capturados direto do Alle Documentos no sync (ver
-- sync-alle-documentos.ts) — sem isso não dá pra saber quem é quem na lista de
-- clientes convertidos (/convertidos), principalmente os "sem unidade"
-- (academia_id null), que não têm mais nenhuma outra pista de identificação.
alter table conversions add column nome text;
alter table conversions add column telefone text;
