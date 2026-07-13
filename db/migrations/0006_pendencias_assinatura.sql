-- Substitui o modelo de lista individual (pending_signatures: um registro por
-- aluno, marcado como assinado um a um) por um lançamento manual numérico, um
-- por academia por dia — mesmo padrão de manual_data (0001_init.sql), usado pela
-- página /pendentes. pending_signatures não é dropada (preserva histórico e é
-- referenciada por dado que já possa existir em produção), só deixa de ser usada
-- pelo código a partir desta migration.
comment on table pending_signatures is 'Descontinuada — substituída por pendencias_assinatura (lançamento manual numérico por academia/dia). Mantida só por histórico, sem UI.';

create table pendencias_assinatura (
  id           uuid primary key default gen_random_uuid(),
  academia_id  uuid not null references academias (id),
  data         date not null,
  quantidade   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (academia_id, data)
);

comment on table pendencias_assinatura is 'Um lançamento manual por academia por dia — quantos alunos estão com assinatura de termo pendente naquele momento.';

create index pendencias_assinatura_academia_data_idx on pendencias_assinatura (academia_id, data);
