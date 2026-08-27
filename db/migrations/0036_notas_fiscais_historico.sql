-- Histórico de eventos (upload, substituição, exclusão) de notas fiscais — pedido
-- explícito do usuário pra Direção e Super Admin conseguirem ver quem anexou/trocou/
-- removeu qual arquivo e quando. notas_fiscais (migration 0025) guarda só o estado
-- ATUAL por academia/tipo/mês (upsert em uploadNotaFiscal sobrescreve o registro
-- anterior, e deleteNotaFiscal apaga a linha de vez) — sem essa tabela, o rastro de
-- quem subiu a versão anterior de um arquivo se perde a cada substituição.
--
-- Mesmo espírito de login_audit_log (migration 0024): email gravado como snapshot
-- (performed_by_email) em vez de só join com users, porque o histórico deve
-- continuar legível mesmo se o usuário for removido depois — performed_by usa
-- "on delete set null" pelo mesmo motivo.
--
-- Gravação é explícita em uploadNotaFiscal/deleteNotaFiscal (financeiro/actions.ts),
-- não por trigger: só existem esses dois pontos de escrita em notas_fiscais hoje
-- (diferente de clientes_alle_status_history, migration 0035, que tinha 6 pontos de
-- escrita espalhados em 2 arquivos — aqui não há esse risco de duplicação).
create table notas_fiscais_historico (
  id                  uuid primary key default gen_random_uuid(),
  academia_id         uuid not null references academias (id),
  tipo                text not null check (tipo in ('unidade', 'individual')),
  competencia_ano     smallint not null,
  competencia_mes     smallint not null check (competencia_mes between 1 and 12),
  acao                text not null check (acao in ('upload', 'substituicao', 'exclusao')),
  nome_arquivo        text not null,
  tamanho_bytes       integer not null,
  performed_by        uuid references users (id) on delete set null,
  performed_by_email  text not null,
  created_at          timestamptz not null default now()
);

-- Índice principal de leitura: histórico de um slot específico (academia + tipo +
-- competência), mais recente primeiro — ver fetch-nota-fiscal-historico.ts.
create index notas_fiscais_historico_slot_idx
  on notas_fiscais_historico (academia_id, tipo, competencia_ano, competencia_mes, created_at desc);

comment on table notas_fiscais_historico is 'Uma linha por evento (upload, substituição ou exclusão) de nota fiscal — histórico de leitura pra Direção/Super Admin em /financeiro, complementar ao estado atual em notas_fiscais.';
comment on column notas_fiscais_historico.acao is '"upload" = 1º arquivo daquele slot; "substituicao" = já existia um arquivo e foi trocado; "exclusao" = arquivo removido sem novo upload.';
