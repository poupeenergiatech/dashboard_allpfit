-- Clientes ativos na Alle Energia, cadastrados manualmente (nome/telefone/email) por academia.
-- Sem sincronização automática por enquanto — a quantidade exibida é sempre a contagem de
-- registros com ativo = true. Ver src/lib/dashboard/fetch-clientes-alle.ts.
create table clientes_alle (
  id           uuid primary key default gen_random_uuid(),
  academia_id  uuid not null references academias (id),
  nome         text not null,
  telefone     text,
  email        text,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table clientes_alle is 'Clientes ativos na Alle Energia, cadastrados manualmente (nome/telefone/email) por academia — sem sincronização automática por enquanto; a quantidade exibida é a contagem de registros ativos.';

create index clientes_alle_academia_id_idx on clientes_alle (academia_id);
create index clientes_alle_ativos_idx on clientes_alle (academia_id) where ativo;
