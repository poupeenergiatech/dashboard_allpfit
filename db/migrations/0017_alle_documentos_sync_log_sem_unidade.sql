-- Antes desta migration, um convertido do Alle Documentos com unidade_allpfit em
-- branco desaparecia silenciosamente da contagem do sync — não virava "inserida",
-- não virava "já existente" e não entrava em nao_encontradas (que só registra nomes
-- não-vazios, ver src/lib/dashboard/sync-alle-documentos.ts). total_convertidos
-- nunca batia com inseridas + já_existentes + não_encontradas, sem nenhuma pista do
-- porquê. Esse novo contador torna esses casos visíveis.
alter table alle_documentos_sync_log add column sem_unidade integer not null default 0;

comment on column alle_documentos_sync_log.sem_unidade is 'Quantos convertidos do lote tinham unidade_allpfit em branco no Alle Documentos — não dá pra vincular a nenhuma academia automaticamente nem por alias, precisa corrigir na origem.';
