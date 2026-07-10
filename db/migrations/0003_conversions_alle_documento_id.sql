-- Rastreia qual linha de alle_documentos_clientes (Supabase, fora deste banco) já virou
-- uma conversão aqui — sem isso, sincronizar de novo duplicaria as mesmas conversões.
-- Ver src/app/(app)/configuracoes/actions.ts (syncAlleDocumentosConvertidos).
alter table conversions add column alle_documento_id bigint unique;

comment on column conversions.alle_documento_id is 'id da linha em alle_documentos_clientes (Supabase) que originou esta conversão — null quando a conversão não veio dessa sincronização (ex.: webhook do agregador).';
