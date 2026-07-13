-- Nomes alternativos de unidade vindos de sistemas externos (hoje só o Alle
-- Documentos) que não batem com academias.nome mesmo após normalização — ex.:
-- "João Pessoa" sem sufixo de estado, enquanto a academia está cadastrada como
-- "João Pessoa - PB". Super Admin vincula manualmente pela tela de sync; da
-- próxima vez o alias resolve direto, sem precisar bater string.
create table academia_aliases (
  id           uuid primary key default gen_random_uuid(),
  academia_id  uuid not null references academias (id) on delete cascade,
  alias_nome   text not null,
  created_at   timestamptz not null default now()
);

create unique index academia_aliases_nome_idx on academia_aliases (lower(trim(alias_nome)));
create index academia_aliases_academia_id_idx on academia_aliases (academia_id);
