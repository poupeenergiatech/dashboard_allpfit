-- Validação de nota fiscal por Direção/Super Admin — pedido explícito do usuário:
-- o arquivo anexado (notas_fiscais, migration 0025) passa a carregar um status de
-- revisão além do PDF em si. "pendente" é o estado inicial de qualquer upload/
-- substituição (ver reset em uploadNotaFiscal, financeiro/actions.ts) — quem
-- anexa não se autovalida.
alter table notas_fiscais
  add column status text not null default 'pendente' check (status in ('pendente', 'validado', 'reprovado')),
  add column validated_by uuid references users (id) on delete set null,
  add column validated_by_email text,
  add column validated_at timestamptz;

comment on column notas_fiscais.status is 'Revisão de Direção/Super Admin sobre o arquivo atual — "pendente" (padrão, inclusive logo após qualquer novo upload/substituição), "validado" ou "reprovado". Ver canValidateNotasFiscais.';

-- Histórico (migration 0036) ganha 3 novas "ações" pra registrar quando o status
-- muda por decisão de quem valida — complementa upload/substituicao/exclusao, que
-- já cobriam só o ciclo de vida do arquivo em si, não a revisão dele.
alter table notas_fiscais_historico drop constraint notas_fiscais_historico_acao_check;
alter table notas_fiscais_historico add constraint notas_fiscais_historico_acao_check
  check (acao in ('upload', 'substituicao', 'exclusao', 'status_validado', 'status_reprovado', 'status_pendente'));
